import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const url = new URL(process.env.DATABASE_URL);
const name = decodeURIComponent(url.pathname.slice(1));
if (!name) throw new Error('DATABASE_URL needs a database name');
url.pathname = '/postgres';
const client = new Client({ connectionString: url.toString() });
await client.connect();
try {
  const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (existing.rowCount === 0) await client.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
  process.stdout.write(`${name}: ${existing.rowCount === 0 ? 'created' : 'already exists'}\n`);
} finally { await client.end(); }
