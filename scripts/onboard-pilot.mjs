import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
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

// ── Parse command line arguments ──────────────────────────────────────────────
const rosterPathArg = process.argv[2];
if (!rosterPathArg) {
  console.error('ERROR: Please provide the roster JSON file path.\nUsage: node scripts/onboard-pilot.mjs <roster-file-path>');
  process.exit(1);
}

const rosterResolvedPath = resolve(process.cwd(), rosterPathArg);
let rosterData;
try {
  rosterData = JSON.parse(readFileSync(rosterResolvedPath, 'utf8'));
} catch (err) {
  console.error(`ERROR: Failed to read or parse roster file at ${rosterResolvedPath}: ${err.message}`);
  process.exit(1);
}

if (!rosterData.clinic) {
  console.error('ERROR: Roster must specify a clinic name.');
  process.exit(1);
}

if (!Array.isArray(rosterData.users)) {
  console.error('ERROR: Roster must contain a "users" array.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = randomBytes(16);
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[bytes[i] % chars.length];
  }
  // Ensure it has at least one number, one uppercase, one lowercase, one special char
  // The chars alphabet and random bytes selection does this with extremely high probability,
  // but to guarantee it:
  if (!/[a-z]/.test(password)) password += 'a';
  if (!/[A-Z]/.test(password)) password += 'A';
  if (!/[0-9]/.test(password)) password += '1';
  if (!/[!@#$%^&*]/.test(password)) password += '!';
  return password;
}

async function run() {
  console.log(`\nStarting pilot onboarding for clinic: "${rosterData.clinic}"`);

  // 1. Fetch all existing auth users and database profiles to check for existence
  console.log('Fetching existing users from database...');
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    throw new Error(`listUsers failed: ${authErr.message}`);
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, role');
  if (profErr) {
    throw new Error(`Fetch profiles failed: ${profErr.message}`);
  }

  const emailToUser = new Map();
  for (const u of authData.users) {
    emailToUser.set(u.email.toLowerCase().trim(), { id: u.id, role: u.user_metadata?.role || 'client' });
  }
  for (const p of profiles) {
    emailToUser.set(p.email.toLowerCase().trim(), { id: p.id, role: p.role });
  }

  // 2. Onboard users
  const credentialsOut = [];
  const resolvedRosterUsers = new Map(); // email -> id

  console.log('\n── Processing Users ──────────────────────────────────────────────');
  for (const user of rosterData.users) {
    const email = user.email?.trim();
    if (!email) {
      console.warn('Skipping user with empty email.');
      continue;
    }
    const role = user.role?.trim();
    const first_name = user.first_name?.trim() || null;
    const last_name = user.last_name?.trim() || null;

    const emailKey = email.toLowerCase();
    const existing = emailToUser.get(emailKey);

    if (existing) {
      console.log(`  [existing] ${email} (${role}) → ${existing.id}`);
      resolvedRosterUsers.set(emailKey, existing.id);
      credentialsOut.push({
        email,
        role,
        password: 'existing'
      });
    } else {
      const tempPassword = generateRandomPassword();
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role, first_name, last_name },
      });

      if (createErr) {
        throw new Error(`createUser(${email}) failed: ${createErr.message}`);
      }

      const userId = created.user.id;
      console.log(`  [created]  ${email} (${role}) → ${userId}`);
      resolvedRosterUsers.set(emailKey, userId);
      credentialsOut.push({
        email,
        role,
        password: tempPassword
      });
    }
  }

  // Helper to resolve email to uuid
  async function resolvePractitionerId(email, clientEmail) {
    const emailKey = email.toLowerCase().trim();
    // check roster users first
    if (resolvedRosterUsers.has(emailKey)) {
      return resolvedRosterUsers.get(emailKey);
    }
    // check database map
    if (emailToUser.has(emailKey)) {
      return emailToUser.get(emailKey).id;
    }
    // not found anywhere
    throw new Error(`Practitioner with email "${email}" specified for client "${clientEmail}" exists neither in the roster nor in the database.`);
  }

  // 3. Process Links
  console.log('\n── Processing Practitioner-Client Links ──────────────────────────');
  const linksToUpsert = [];

  for (const user of rosterData.users) {
    if (user.role?.trim() !== 'client') continue;

    const clientEmail = user.email?.trim();
    if (!clientEmail) continue;

    const clientEmailKey = clientEmail.toLowerCase();
    const clientId = resolvedRosterUsers.get(clientEmailKey);
    if (!clientId) {
      console.warn(`Could not resolve ID for client ${clientEmail}, skipping links.`);
      continue;
    }

    const physioEmail = user.physio_email?.trim();
    if (physioEmail) {
      const physioId = await resolvePractitionerId(physioEmail, clientEmail);
      linksToUpsert.push({
        practitioner_id: physioId,
        client_id: clientId,
        role: 'physio',
        status: 'active'
      });
    }

    const trainerEmail = user.trainer_email?.trim();
    if (trainerEmail) {
      const trainerId = await resolvePractitionerId(trainerEmail, clientEmail);
      linksToUpsert.push({
        practitioner_id: trainerId,
        client_id: clientId,
        role: 'trainer',
        status: 'active'
      });
    }
  }

  if (linksToUpsert.length > 0) {
    const { data: linkRows, error: linkErr } = await supabase
      .from('practitioner_client_links')
      .upsert(linksToUpsert, { onConflict: 'practitioner_id,client_id,role' })
      .select('id, role, practitioner_id, client_id');

    if (linkErr) {
      throw new Error(`upsert links failed: ${linkErr.message}`);
    }
    console.log(`  Successfully upserted ${linkRows.length} link(s).`);
  } else {
    console.log('  No practitioner-client links to upsert.');
  }

  // 4. Output results
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CREDENTIALS TABLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.table(
    credentialsOut.map(c => ({
      'Email': c.email,
      'Role': c.role,
      'Temporary Password': c.password
    }))
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Write credentials to scripts/onboard-output-<timestamp>.json
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFilename = `onboard-output-${timestamp}.json`;
  const outputPath = resolve(__dirname, outputFilename);

  const outputPayload = {
    clinic: rosterData.clinic,
    timestamp: new Date().toISOString(),
    credentials: credentialsOut
  };

  writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`Credentials saved to ${outputPath}\n`);
}

run().catch(err => {
  console.error(`\nFATAL ERROR: ${err.message}`);
  process.exit(1);
});
