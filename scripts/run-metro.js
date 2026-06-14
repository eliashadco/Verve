import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(__dirname, 'metro-logs.txt');

const out = openSync(logPath, 'w');

console.log('Starting Metro server and logging to:', logPath);

const metro = spawn('npx', ['expo', 'start', '--clear'], {
  stdio: ['ignore', out, out],
  shell: true,
  cwd: resolve(__dirname, '..')
});

metro.on('error', (err) => {
  console.error('Metro failed to start:', err);
});

console.log('Metro spawned with PID:', metro.pid);
