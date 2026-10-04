import { afterAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import { fixtureCompany, type CompanyPort } from '../companies/index.js';
import { EmployeesRepository } from './employees.repository.js';
import { EmployeesService } from './employees.service.js';
import { employee, createEmployee } from '@fernleaf/shared';
import { fixtureIds, seedTestFixtures } from '../../../prisma/test-fixtures.js';

const db = new PrismaService();
const companies: CompanyPort = {
  get: async id => id === fixtureIds.company[0] || id === fixtureIds.company[1] ? { ...fixtureCompany, id, domains: ['fixture-1.example'] } : null,
  getAddress: async () => null,
  allowsDelivery: async () => true,
};
const service = new EmployeesService(new EmployeesRepository(db), new TxRunner(db), companies);
const ids: string[] = [];
afterAll(async () => {
  await db.employeeAllergen.deleteMany({ where: { employeeId: { in: ids } } });
  await db.employeeDietaryTag.deleteMany({ where: { employeeId: { in: ids } } });
  await db.employee.deleteMany({ where: { id: { in: ids } } });
  await db.onModuleDestroy();
});

describe('employee database routes and port', () => {
  it('normalizes email, defaults flags, and conforms to the contract', async () => {
    await seedTestFixtures(db);
    const company = await companies.get(fixtureIds.company[0]!);
    const body = createEmployee.body.parse({ companyId: company!.id, name: 'Employee DB Test', email: `New@${company!.domains[0]}`, phone: null,
      canChooseAddress: false, canChangeDeliveryTime: false, canChangePackaging: false,
      allergenIds: [], dietaryTagIds: [], isActive: true });
    const created = employee.parse(await service.create(body));
    ids.push(created.id);
    expect(created.email).toBe(body.email.toLowerCase());
    expect((await service.get(created.id))?.id).toBe(created.id);
    expect((await service.list({ page: 1, pageSize: 25, companyId: company!.id })).items.some(item => item.id === created.id)).toBe(true);
    await expect(service.create(body)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('rejects a foreign email domain, but allows a company move', async () => {
    const id = ids[0]!;
    await expect(service.update(id, { email: 'bad@elsewhere.test' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const moved = employee.parse(await service.update(id, { companyId: fixtureIds.company[1]! }));
    expect(moved.companyId).toBe(fixtureIds.company[1]);
    expect(moved.email).toContain('@fixture-1.example');
  });
});
