import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
// Generation needs a syntactically valid URL but does not connect to a database.
const generateUrl = 'postgresql://localhost:5432/fernleaf_generate';
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? (process.argv[2] === 'generate' ? generateUrl : env('DATABASE_URL'));
export default defineConfig({ schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations' }, datasource: { url: databaseUrl, shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } });
