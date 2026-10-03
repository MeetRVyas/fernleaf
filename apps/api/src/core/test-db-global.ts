import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import type { TestProject } from 'vitest/node';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

function databaseUrl(name: string): string { const url = new URL(process.env.DATABASE_URL!); url.pathname = `/${name}`; return url.toString(); }
function adminUrl(): string { return databaseUrl('postgres'); }
function quoted(name: string): string { return `"${name.replaceAll('"', '""')}"`; }
export default async function setup(project: TestProject) {
  config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)) });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for database tests');
  const testHost = new URL(process.env.DATABASE_URL).hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(testHost) && process.env.ALLOW_REMOTE_TEST_DB !== '1') throw new Error('Refusing a non-local DATABASE_URL without ALLOW_REMOTE_TEST_DB=1');
  const runId = randomUUID().replaceAll('-', '').slice(0, 16);
  const template = `fernleaf_test_template_${runId}`;
  const admin = new Client({ connectionString: adminUrl() });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${quoted(template)}`);
  const cleanup = async () => {
    const names = (await admin.query<{ datname: string }>('SELECT datname FROM pg_database WHERE datname LIKE $1', [`fernleaf_test_${runId}_%`])).rows.map(row => row.datname);
    for (const name of [...names, template]) {
      await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [name]);
      await admin.query(`DROP DATABASE IF EXISTS ${quoted(name)}`);
    }
    await admin.end();
  };
  const oldUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = databaseUrl(template);
    const pnpm = process.env.npm_execpath;
    if (!pnpm) throw new Error('Run database tests through pnpm');
    execFileSync(process.execPath, [pnpm, '--filter', '@fernleaf/api', 'exec', 'prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
  } catch (error) {
    await cleanup();
    throw error;
  } finally { process.env.DATABASE_URL = oldUrl; }
  project.provide('dbRunId', runId);
  return cleanup;
}
declare module 'vitest' { export interface ProvidedContext { dbRunId: string } }
