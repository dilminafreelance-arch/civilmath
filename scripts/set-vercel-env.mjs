import fs from 'fs';
import { execFileSync } from 'child_process';

const raw = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const key = line.slice(0, i).trim();
  const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  env[key] = val;
}

function setEnv(name, value, target) {
  if (!value) {
    console.warn(`Skipping ${name} for ${target} — no value in .env`);
    return;
  }
  console.log(`Setting ${name} for ${target}...`);
  execFileSync('npx', ['vercel', 'env', 'add', name, target, '--force'], {
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
}

const targets = ['production', 'preview'];

for (const target of targets) {
  setEnv('OPENROUTER_API_KEY', env.OPENROUTER_API_KEY, target);
  setEnv('VITE_GA_MEASUREMENT_ID', env.VITE_GA_MEASUREMENT_ID, target);
  setEnv(
    'APP_URL',
    env.APP_URL && !env.APP_URL.includes('MY_APP') && !env.APP_URL.includes('localhost')
      ? env.APP_URL
      : 'https://civilmath-civil.vercel.app',
    target
  );
  setEnv('ADMIN_EMAIL', env.ADMIN_EMAIL, target);
  setEnv('ADMIN_PASSWORD', env.ADMIN_PASSWORD, target);
  setEnv('ADMIN_SESSION_SECRET', env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD, target);
}

console.log('VERCEL_ENV_SYNC_DONE');
