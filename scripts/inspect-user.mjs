import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env.seed');

let rawEnv;
try {
  rawEnv = readFileSync(ENV_PATH, 'utf8');
} catch (e) {
  console.error('Failed to read .env.seed file', e.message);
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

const supabaseUrl = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const userId = '30e4f1b5-ee99-4f24-aae9-9130d46aef10';
  console.log('Fetching user details from Supabase Auth admin API...');
  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error) {
    console.error('Failed to fetch user:', error.message);
  } else {
    console.log('User found:', JSON.stringify(data.user, null, 2));
  }
}

run();
