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

const openrouterKey = env.OPENROUTER_API_KEY || '';
const appUrl = 'https://civilmath-civil.netlify.app';

if (!openrouterKey) {
  console.error('MISSING_OPENROUTER_KEY');
  process.exit(1);
}

function setEnv(key, value) {
  console.log(`Setting ${key} for production...`);
  execFileSync('npx', ['netlify', 'env:set', key, value, '--context', 'production'], {
    stdio: 'inherit',
    shell: true,
  });
}

setEnv('OPENROUTER_API_KEY', openrouterKey);
setEnv('APP_URL', appUrl);
console.log('ENV_SET_DONE');
