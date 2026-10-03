import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['apps/api/**/*.db.test.ts'], exclude: ['**/node_modules/**'], globalSetup: ['apps/api/src/core/test-db-global.ts'], setupFiles: ['apps/api/src/core/test-db-worker.ts'] } });
