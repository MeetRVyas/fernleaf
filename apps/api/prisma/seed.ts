import { hash } from '@node-rs/argon2';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
pool.on('error', error => process.stderr.write(`${error.message}\n`));
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const passwordHash = await hash('Test@1234');
for (const [name, email, role] of [
  ['Admin', 'admin@test.com', 'ADMIN'],
  ['Kitchen', 'kitchen@test.com', 'KITCHEN'],
  ['Dispatch', 'dispatch@test.com', 'DISPATCH'],
  ['Driver', 'driver@test.com', 'DRIVER'],
]) await db.staffUser.upsert({ where: { email }, update: { name, role }, create: { name, email, role, passwordHash } });
await db.$disconnect();
await pool.end();
