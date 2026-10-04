import { afterAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import { CompaniesRepository } from './companies.repository.js';
import { CompaniesService } from './companies.service.js';
import {
  company,
  companyAddress,
  companyHoliday,
  createCompany,
} from '@fernleaf/shared';

const db = new PrismaService();
const service = new CompaniesService(
  new CompaniesRepository(db),
  new TxRunner(db),
);
const createdIds: string[] = [];
afterAll(async () => {
  await db.companyHoliday.deleteMany({
    where: { companyId: { in: createdIds } },
  });
  await db.companyAddress.deleteMany({
    where: { companyId: { in: createdIds } },
  });
  await db.companyDomain.deleteMany({
    where: { companyId: { in: createdIds } },
  });
  await db.company.deleteMany({ where: { id: { in: createdIds } } });
  await db.onModuleDestroy();
});

const body = createCompany.body.parse({
  name: 'Companies DB Test',
  tierId: null,
  defaultDeliveryTime: '12:00',
  deliveryLeadMinutes: 60,
  defaultPackaging: 'STANDARD',
  driverInstructions: '',
  defaultDriverId: null,
  billingName: 'Test',
  billingEmail: 'Billing@Test.Example',
  billingPhone: '',
  billingAddress: '100 Main',
  ownerEmployeeId: null,
  workingDays: [1, 2, 3, 4, 5],
  domains: ['Corp.Test'],
  isActive: true,
  addresses: [
    {
      label: 'HQ',
      line1: '100 Main',
      line2: null,
      city: 'New York',
      region: 'NY',
      postalCode: '10001',
      country: 'US',
      isDefault: true,
    },
  ],
});

describe('companies database routes and port', () => {
  it('creates a conforming company with one default address', async () => {
    const created = company.parse(await service.create(body));
    createdIds.push(created.id);
    expect(created.domains).toEqual(['corp.test']);
    expect(created.billingEmail).toBe('billing@test.example');
    expect(created.addresses).toHaveLength(1);
    expect((await service.get(created.id))?.id).toBe(created.id);
    expect(
      companyAddress.parse(await service.getAddress(created.addresses[0]!.id))
        .isDefault,
    ).toBe(true);
    expect(
      (await service.list({ page: 1, pageSize: 25 })).items.some(
        (item) => item.id === created.id,
      ),
    ).toBe(true);
  });
  it('rejects duplicate domains and multiple defaults', async () => {
    await expect(
      service.create({ ...body, name: 'Other company' }),
    ).rejects.toMatchObject({ code: 'DOMAIN_TAKEN' });
    await expect(
      service.create({
        ...body,
        name: 'Bad defaults',
        domains: ['other.test'],
        addresses: [body.addresses[0]!, body.addresses[0]!],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
  it('enforces the company calendar and holiday uniqueness', async () => {
    const id = createdIds[0]!;
    const record = companyHoliday.parse(
      await service.createHoliday(id, '2031-10-06', 'Closed'),
    );
    expect(await service.allowsDelivery(id, '2031-10-06')).toBe(false);
    await expect(
      service.createHoliday(id, '2031-10-06', 'Again'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await service.deleteHoliday(record.id)).toEqual({ ok: true });
  });
  it('returns one conflict for simultaneous holiday creation', async () => {
    const id = createdIds[0]!;
    const results = await Promise.allSettled([
      service.createHoliday(id, '2031-10-07', 'Closed'),
      service.createHoliday(id, '2031-10-07', 'Closed'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({ reason: { code: 'CONFLICT' } });
  });
});
