import { afterAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { generateModule } from './module-generator.js';

const root = await mkdtemp(join(tmpdir(), 'fernleaf-scaffold-'));
afterAll(async () => {
  if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw new Error('Refusing to remove a path outside the temp directory');
  await rm(root, { recursive: true, force: true });
});
describe('module scaffold', () => {
  it('creates every backend layer and a spec from the template', async () => {
    await mkdir(join(root, 'docs'), { recursive: true });
    await writeFile(join(root, 'docs', 'module-spec-template.md'), '## How it works\n');
    await generateModule('sample-module', root);
    const names = await readdir(join(root, 'apps', 'api', 'src', 'modules', 'sample-module'));
    expect(names).toEqual(expect.arrayContaining(['sample-module.controller.ts', 'sample-module.service.ts', 'sample-module.repository.ts', 'sample-module.module.ts', 'domain', 'ports.ts', 'events.ts', 'index.ts']));
    expect(await readFile(join(root, 'docs', 'modules', 'sample-module.md'), 'utf8')).toContain('## How it works');
    await expect(generateModule('sample-module', root)).rejects.toThrow('already exists');
    await expect(generateModule('../other', root)).rejects.toThrow('Usage');
  });
});
