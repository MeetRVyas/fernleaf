import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const source = new URL(process.env.DATABASE_URL);
const name = `fernleaf_shadow_${randomUUID().replaceAll('-', '')}`;
const adminUrl = new URL(source);
adminUrl.pathname = '/postgres';
const shadowUrl = new URL(source);
shadowUrl.pathname = `/${name}`;
const admin = new Client({ connectionString: adminUrl.toString() });
await admin.connect();
await admin.query(`CREATE DATABASE "${name}"`);
try {
  const pnpm = process.env.npm_execpath;
  if (!pnpm) throw new Error('Run through pnpm');
  execFileSync(process.execPath, [pnpm, 'exec', 'prisma', 'migrate', 'diff', '--from-migrations', 'prisma/migrations', '--to-schema', 'prisma/schema.prisma', '--exit-code'], { stdio: 'inherit', env: { ...process.env, SHADOW_DATABASE_URL: shadowUrl.toString() } });
} finally {
  await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [name]);
  await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
  await admin.end();
}
