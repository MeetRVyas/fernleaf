import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('fresh-clone setup', () => {
  it('generates Prisma before the standalone seed command', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(scripts.scripts['db:seed']).toContain('prisma generate');
  });

  it('documents the web rewrite target in the environment example', () => {
    const example = readFileSync('.env.example', 'utf8');
    expect(example).toContain('API_INTERNAL_URL=http://127.0.0.1:3001');
    const config = readFileSync('apps/web/next.config.ts', 'utf8');
    expect(config).toContain("process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001'");
  });
});
