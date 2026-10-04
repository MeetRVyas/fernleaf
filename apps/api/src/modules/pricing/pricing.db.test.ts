import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import { StubCataloguePort, STUB_DISH_ID } from '../catalogue/index.js';
import { StubCompanyPort, STUB_COMPANY_ID } from '../companies/index.js';
import { PricingRepository } from './pricing.repository.js';
import { PricingService } from './pricing.service.js';

const none = {
  derivationKind: 'NONE' as const,
  factorMilli: null,
  baseTierId: null,
  percentBp: null,
};
let db: PrismaService;
let service: PricingService;

beforeAll(() => {
  db = new PrismaService();
  service = new PricingService(
    new PricingRepository(db),
    new TxRunner(db),
    new StubCataloguePort(),
    new StubCompanyPort(),
  );
});
afterAll(async () => {
  await db?.onModuleDestroy();
});

describe('pricing database', () => {
  it('keeps one active default and exposes it through the port', async () => {
    await expect(
      service.createTier({
        name: 'No default',
        isDefault: false,
        isActive: true,
        ...none,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const tier = await service.createTier({
      name: 'Standard',
      isDefault: true,
      isActive: true,
      ...none,
    });
    expect(await service.effectiveTierId(STUB_COMPANY_ID)).toBe(tier.id);
    await expect(
      service.createTier({
        name: 'Other default',
        isDefault: true,
        isActive: true,
        ...none,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      service.updateTier(tier.id, { isActive: false }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
  it('stores overrides and resolves the derived price through the port', async () => {
    const standard = (await service.listTiers()).find(
      (tier) => tier.isDefault,
    )!;
    await service.setManualPrice(standard.id, 'DISH', STUB_DISH_ID, 215);
    const base = await service.createTier({
      name: 'Manual base',
      isDefault: false,
      isActive: true,
      ...none,
    });
    const derived = await service.createTier({
      name: 'Derived',
      isDefault: false,
      isActive: true,
      derivationKind: 'PERCENT_OVER_TIER',
      baseTierId: base.id,
      percentBp: 1500,
      factorMilli: null,
    });
    await service.setManualPrice(base.id, 'DISH', STUB_DISH_ID, 333);
    const price = await service.resolve(derived.id, [
      { type: 'DISH', id: STUB_DISH_ID, costCents: 88 },
    ]);
    expect(price.get(`DISH:${STUB_DISH_ID}`)).toBe(385);
    await service.clearManualPrice(base.id, 'DISH', STUB_DISH_ID);
    expect(
      (
        await service.resolve(derived.id, [
          { type: 'DISH', id: STUB_DISH_ID, costCents: 88 },
        ])
      ).get(`DISH:${STUB_DISH_ID}`),
    ).toBeNull();
    expect(
      (
        await service.getTierPrices(derived.id, {
          page: 1,
          pageSize: 25,
          missingOnly: true,
        })
      ).items[0]?.source,
    ).toBe('MISSING');
  });
});
