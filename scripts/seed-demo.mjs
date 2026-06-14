import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// ── .env.seed parser ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env.seed');

let rawEnv;
try {
  rawEnv = readFileSync(ENV_PATH, 'utf8');
} catch {
  console.error(`ERROR: ${ENV_PATH} not found.\nCreate it with:\n  SUPABASE_URL=https://your-ref.supabase.co\n  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`);
  process.exit(1);
}

const env = {};
for (const line of rawEnv.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set in .env.seed');
  process.exit(1);
}

// ── Supabase admin client ─────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── helpers ───────────────────────────────────────────────────────────────────
async function findOrCreateUser(email, password, meta) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`listUsers failed: ${error.message}`);

  const existing = data.users.find(u => u.email === email);
  if (existing) {
    console.log(`  [found]   ${email} → ${existing.id}`);
    return existing;
  }

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (createErr) throw new Error(`createUser(${email}) failed: ${createErr.message}`);
  console.log(`  [created] ${email} → ${created.user.id}`);
  return created.user;
}

// ── Step 1: users ─────────────────────────────────────────────────────────────
console.log('\n── Step 1: Users ─────────────────────────────────────────────────');

const PASSWORD = 'VerveDemo!2026';

const physio  = await findOrCreateUser('physio.demo@verve.app',  PASSWORD, { role: 'physio',   first_name: 'Anna',  last_name: 'Keller' });
const trainer = await findOrCreateUser('trainer.demo@verve.app', PASSWORD, { role: 'trainer',  first_name: 'Mike',  last_name: 'Ross'   });
const client  = await findOrCreateUser('client.demo@verve.app',  PASSWORD, { role: 'client',   first_name: 'Sarah', last_name: 'Chen'   });

const physioId  = physio.id;
const trainerId = trainer.id;
const clientId  = client.id;

// ── Step 2: practitioner-client links ─────────────────────────────────────────
console.log('\n── Step 2: Links ─────────────────────────────────────────────────');

const { data: linkRows, error: linkErr } = await supabase
  .from('practitioner_client_links')
  .upsert(
    [
      { practitioner_id: physioId,  client_id: clientId, role: 'physio'  },
      { practitioner_id: trainerId, client_id: clientId, role: 'trainer' },
    ],
    { onConflict: 'practitioner_id,client_id,role' }
  )
  .select('id, role');
if (linkErr) throw new Error(`upsert links failed: ${linkErr.message}`);
console.log(`  Upserted ${linkRows.length} link(s): ${linkRows.map(l => l.role).join(', ')}`);

// ── Step 3: program (only if client has none yet) ─────────────────────────────
console.log('\n── Step 3: Program ───────────────────────────────────────────────');

const { data: existingPrograms, error: checkErr } = await supabase
  .from('programs')
  .select('id')
  .eq('assigned_to', clientId)
  .limit(1);
if (checkErr) throw new Error(`program check failed: ${checkErr.message}`);

let programId;

if (existingPrograms.length > 0) {
  programId = existingPrograms[0].id;
  console.log(`  Client already has a program. Skipping insert. (id: ${programId})`);
} else {
  const { data: exRows, error: exErr } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', 'Barbell Back Squat')
    .limit(1);
  if (exErr) throw new Error(`exercise lookup failed: ${exErr.message}`);
  if (!exRows || exRows.length === 0) {
    throw new Error('"Barbell Back Squat" not found in exercises table — has seed.sql been applied?');
  }
  const squatId = exRows[0].id;

  // days shape mirrors ProgramDay[] / ProgramDayExercise[] from src/types/database.ts
  const days = [
    {
      label: 'Day 1',
      dayOfWeek: 1,
      exercises: [
        {
          exerciseId: squatId,
          sets: 4,
          reps: '8-10',
          rir: 2,
          restSeconds: 120,
          tempo: null,
          notes: null,
          warmup: false,
          order: 0,
          supersetGroup: null,
        },
      ],
    },
  ];

  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .insert({
      name: 'Demo Strength Program',
      created_by: trainerId,
      assigned_to: clientId,
      focus: 'strength',
      phase: 'Phase 1',
      duration_weeks: 4,
      days,
      status: 'active',
    })
    .select('id')
    .single();
  if (progErr) throw new Error(`insert program failed: ${progErr.message}`);
  programId = prog.id;
  console.log(`  Created program: ${programId}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
const { count: linkCount, error: countErr } = await supabase
  .from('practitioner_client_links')
  .select('id', { count: 'exact', head: true })
  .eq('client_id', clientId);
if (countErr) throw new Error(`link count failed: ${countErr.message}`);

const row = (label, value) => console.log(`  ${label.padEnd(26)}${value}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SEED SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
row('physio.demo@verve.app',  physioId);
row('trainer.demo@verve.app', trainerId);
row('client.demo@verve.app',  clientId);
row('Links for client',        String(linkCount));
row('Program ID',              programId);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  ► PHYSIO UUID  : ${physioId}`);
console.log(`  ► CLIENT UUID  : ${clientId}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
