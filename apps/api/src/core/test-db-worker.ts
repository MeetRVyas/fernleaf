import { inject } from 'vitest';
import { Client } from 'pg';

const source = process.env.DATABASE_URL;
if (!source) throw new Error('DATABASE_URL is required for database tests');
const runId = inject('dbRunId');
const workerId = process.env.VITEST_WORKER_ID ?? '1';
const name = `fernleaf_test_${runId}_${workerId}`;
const adminUrl = new URL(source);
adminUrl.pathname = '/postgres';
const admin = new Client({ connectionString: adminUrl.toString() });
await admin.connect();
const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${name}" TEMPLATE "fernleaf_test_template_${runId}"`);
await admin.end();
const testUrl = new URL(source);
testUrl.pathname = `/${name}`;
process.env.DATABASE_URL = testUrl.toString();
process.env.VALIDATE_RESPONSES = 'true';
