import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Usage: pnpm gen:module <kebab-case-name>');
const folder = join('apps', 'api', 'src', 'modules', name);
const doc = join('docs', 'modules', `${name}.md`);
try { await access(folder); throw new Error(`Module ${name} already exists`); } catch (error) { if (error instanceof Error && error.message.includes('already exists')) throw error; }
await mkdir(join(folder, 'domain'), { recursive: true });
await mkdir(join('docs', 'modules'), { recursive: true });
const className = name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
const files: Record<string, string> = {
  [`${name}.controller.ts`]: `import { Controller } from '@nestjs/common';\n@Controller()\nexport class ${className}Controller {}\n`,
  [`${name}.service.ts`]: `import { Injectable } from '@nestjs/common';\n@Injectable()\nexport class ${className}Service {}\n`,
  [`${name}.repository.ts`]: `import { Injectable } from '@nestjs/common';\n@Injectable()\nexport class ${className}Repository {}\n`,
  [`${name}.module.ts`]: `import { Module } from '@nestjs/common';\nimport { ${className}Controller } from './${name}.controller.js';\nimport { ${className}Service } from './${name}.service.js';\nimport { ${className}Repository } from './${name}.repository.js';\n@Module({ controllers: [${className}Controller], providers: [${className}Service, ${className}Repository] })\nexport class ${className}Module {}\n`,
  'ports.ts': 'export {};\n',
  'events.ts': 'export {};\n',
  'index.ts': `export { ${className}Module } from './${name}.module.js';\n`,
  'domain/.gitkeep': '',
};
for (const [file, content] of Object.entries(files)) await writeFile(join(folder, file), content, { flag: 'wx' });
const template = await readFile(join('docs', 'module-spec-template.md'), 'utf8');
await writeFile(doc, `# ${className}\n\n${template}`, { flag: 'wx' });
process.stdout.write(`Created ${folder} and ${doc}\n`);
