import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createAllergen, listAllergens, updateAllergen } from '@fernleaf/shared';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import { ReferenceRepository } from './reference.repository.js';
import { ReferenceService } from './reference.service.js';

let db: PrismaService;
let service: ReferenceService;

beforeAll(() => {
  db = new PrismaService();
  service = new ReferenceService(new ReferenceRepository(db), new TxRunner(db));
});
afterAll(async () => { await db?.onModuleDestroy(); });

describe('Reference with PostgreSQL', () => {
  it('creates, pages and renames an allergen with contract responses', async () => {
    const name = `Milk ${randomUUID()}`;
    const created = await service.create('allergen', { name: ` ${name} `, isActive: true });
    expect(createAllergen.response.parse(created).name).toBe(name);
    const listed = await service.list('allergen', { page: 1, pageSize: 100 });
    expect(listAllergens.response.parse(listed).items).toContainEqual(created);
    const updated = await service.update('allergen', created.id, { name: `${name} 2` });
    expect(updateAllergen.response.parse(updated).name).toBe(`${name} 2`);
  });

  it('enforces a unique name and an existing id', async () => {
    const name = `Soy ${randomUUID()}`;
    await service.create('allergen', { name, isActive: true });
    await expect(service.create('allergen', { name, isActive: true })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(service.update('allergen', randomUUID(), { name })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('does not report deactivation as saved before the schema request lands', async () => {
    await expect(service.create('dietaryTag', { name: `Vegan ${randomUUID()}`, isActive: false })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
