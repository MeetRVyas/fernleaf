import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createAllergen, listAllergens, updateAllergen, createDietaryTag, listDietaryTags, updateDietaryTag, createKitchenStation, listKitchenStations, updateKitchenStation } from '@fernleaf/shared';
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

  it('conforms on dietary tags and kitchen stations', async () => {
    const tag = createDietaryTag.response.parse(await service.create('dietaryTag', { name: `Vegan ${randomUUID()}`, isActive: true }));
    expect(listDietaryTags.response.parse(await service.list('dietaryTag', { page: 1, pageSize: 100 })).items).toContainEqual(tag);
    updateDietaryTag.response.parse(await service.update('dietaryTag', tag.id, { name: `${tag.name} updated` }));
    const station = createKitchenStation.response.parse(await service.create('kitchenStation', { name: `Hot ${randomUUID()}`, isActive: true }));
    expect(listKitchenStations.response.parse(await service.list('kitchenStation', { page: 1, pageSize: 100 })).items).toContainEqual(station);
    updateKitchenStation.response.parse(await service.update('kitchenStation', station.id, { name: `${station.name} updated` }));
  });

  it('lets exactly one of two concurrent creates claim a name', async () => {
    const name = `Concurrent ${randomUUID()}`;
    const results = await Promise.allSettled([
      service.create('allergen', { name, isActive: true }),
      service.create('allergen', { name, isActive: true }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  });
});
