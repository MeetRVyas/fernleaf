import { z } from 'zod';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)) });
const schema = z.object({ DATABASE_URL: z.url(), PORT: z.coerce.number().int().positive().default(3001), COOKIE_SECURE: z.enum(['true', 'false']).default('false'), TRUST_PROXY: z.enum(['true', 'false']).default('true'), KITCHEN_TIMEZONE: z.string().default('America/New_York'), SENTRY_DSN: z.string().optional() });
export const env = schema.parse(process.env);
