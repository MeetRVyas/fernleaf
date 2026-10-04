import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createDish, createOption, createGroup, getDish, listDishes, listOptions, listGroups } from '@fernleaf/shared';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import type { ReferencePort } from '../reference/index.js';
import { CatalogueRepository } from './catalogue.repository.js';
import { CatalogueService } from './catalogue.service.js';

let db: PrismaService;
let service: CatalogueService;
beforeAll(() => {
  db = new PrismaService();
  const tx = new TxRunner(db);
  const reference: ReferencePort = { existingIds: async (kind, ids) => {
    if (kind === 'allergen') return (await db.allergen.findMany({ where: { id: { in: ids } } })).map(row => row.id);
    if (kind === 'dietaryTag') return (await db.dietaryTag.findMany({ where: { id: { in: ids } } })).map(row => row.id);
    return (await db.kitchenStation.findMany({ where: { id: { in: ids } } })).map(row => row.id);
  } };
  service = new CatalogueService(new CatalogueRepository(db), tx, reference);
});
afterAll(async () => { await db?.onModuleDestroy(); });

describe('Catalogue with PostgreSQL', () => {
  it('creates a dish with labels, normalizes SKU, and serves contract responses through the real port', async () => {
    const allergen = await db.allergen.create({ data: { name: `Allergen ${randomUUID()}` } });
    const station = await db.kitchenStation.create({ data: { name: `Station ${randomUUID()}` } });
    const sku = `sku-${randomUUID()}`;
    const result = await service.createDish({ name: 'Rice', description: 'A dish', imageUrl: null, sku: sku.toUpperCase(), temperature: 'HOT', costCents: 88, stationId: station.id, minOrderQty: 1, allergenIds: [allergen.id], dietaryTagIds: [], isActive: true });
    expect(createDish.response.parse(result).sku).toBe(sku);
    expect(result.allergenIds).toEqual([allergen.id]);
    expect((await service.getDish(result.id))?.id).toBe(result.id);
    expect(getDish.response.parse(await service.dishDetail(result.id)).groups).toEqual([]);
    expect(listDishes.response.parse(await service.listDishes({ page: 1, pageSize: 100, q: sku })).items).toContainEqual(result);
    await expect(service.createDish({ name: 'Duplicate', description: '', imageUrl: null, sku: sku.toUpperCase(), temperature: 'COLD', costCents: 0, stationId: null, minOrderQty: 1, allergenIds: [], dietaryTagIds: [], isActive: true })).rejects.toMatchObject({ code: 'CONFLICT' });
    const updated = await service.updateDish(result.id, { stationId: null, isActive: false });
    expect(updated.stationId).toBeNull();
    expect(updated.isActive).toBe(false);
  });

  it('creates reusable options and ordered single-choice group membership', async () => {
    const suffix = randomUUID();
    const dish = await service.createDish({ name: 'Bowl', description: '', imageUrl: null, sku: `bowl-${suffix}`, temperature: 'HOT', costCents: 100, stationId: null, minOrderQty: 1, allergenIds: [], dietaryTagIds: [], isActive: true });
    const option = await service.createOption({ name: 'Tofu', costCents: 25, allergenIds: [], dietaryTagIds: [], isActive: true });
    expect(createOption.response.parse(option).name).toBe('Tofu');
    expect(listOptions.response.parse(await service.listOptions({ page: 1, pageSize: 100, q: 'Tofu' })).items).toContainEqual(option);
    const group = await service.createGroup(dish.id, { name: 'Protein', isRequired: true, sortOrder: 1, options: [{ optionId: option.id, sortOrder: 0 }] });
    expect(createGroup.response.parse(group).options).toEqual([{ optionId: option.id, sortOrder: 0 }]);
    expect(listGroups.response.parse(await service.listGroups(dish.id))).toContainEqual(group);
    await expect(service.updateGroup(group.id, { options: [{ optionId: option.id, sortOrder: 0 }, { optionId: option.id, sortOrder: 1 }] })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await service.deleteGroup(group.id);
    expect(await service.listGroups(dish.id)).toEqual([]);
  });
});
