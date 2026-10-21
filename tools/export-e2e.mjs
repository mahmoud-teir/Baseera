// Web export for the E2E suite: the app is pointed at a fake Supabase project that the tests answer
// with in-test fixtures (e2e/backend.ts). Output: dist-e2e/. Usage: node tools/export-e2e.mjs
import { spawnSync } from 'node:child_process';

const env = { ...process.env, EXPO_PUBLIC_SUPABASE_URL: 'https://e2e.supabase.test', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key' };
const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-e2e'], { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
