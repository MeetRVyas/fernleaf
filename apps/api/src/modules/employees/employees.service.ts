import { Inject, Injectable } from '@nestjs/common';
import { type InputOf, type createEmployee, type listEmployees } from '@fernleaf/shared';
import { ApiError } from '../../core/api-error.js';
import { TxRunner } from '../../core/tx-runner.js';
import { COMPANY_PORT, type CompanyPort } from '../companies/index.js';
import { EmployeesRepository } from './employees.repository.js';
import { emailMatchesCompany, normalizeEmail } from './domain/employee-rules.js';
import type { EmployeePort } from './ports.js';

type Body = InputOf<typeof createEmployee>['body'];
type EmployeeRow = NonNullable<Awaited<ReturnType<EmployeesRepository['get']>>>;
function publicEmployee(row: EmployeeRow) {
  return { id: row.id, companyId: row.companyId, name: row.name, email: row.email, phone: row.phone,
    canChooseAddress: row.canChooseAddress, canChangeDeliveryTime: row.canChangeDeliveryTime,
    canChangePackaging: row.canChangePackaging, allergenIds: row.allergens.map(item => item.allergenId),
    dietaryTagIds: row.dietaryTags.map(item => item.tagId), isActive: row.isActive };
}
function isUnique(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'; }
function uniqueIds(ids: string[], field: string): void { if (new Set(ids).size !== ids.length) throw new ApiError('VALIDATION_ERROR', `Duplicate ${field}`, 422, { [field]: 'Choose each item once' }); }

@Injectable()
export class EmployeesService implements EmployeePort {
  constructor(@Inject(EmployeesRepository) private readonly repository: EmployeesRepository, @Inject(TxRunner) private readonly txRunner: TxRunner, @Inject(COMPANY_PORT) private readonly companies: CompanyPort) {}
  async get(id: string) { const row = await this.repository.get(id); return row ? publicEmployee(row) : null; }
  async requireEmployee(id: string) { const employee = await this.get(id); if (!employee) throw new ApiError('NOT_FOUND', 'Employee not found', 404); return employee; }
  async list(query: InputOf<typeof listEmployees>['query']) { const result = await this.repository.list(query.page, query.pageSize, query.companyId, query.q, query.active, query.sort); return { ...result, items: result.items.map(publicEmployee) }; }
  private async validateCompany(companyId: string, email?: string): Promise<void> {
    const company = await this.companies.get(companyId);
    if (!company) throw new ApiError('VALIDATION_ERROR', 'Company not found', 422, { companyId: 'Choose an existing company' });
    if (email && !emailMatchesCompany(email, company.domains)) throw new ApiError('VALIDATION_ERROR', 'Employee email must match a company domain', 422, { email: 'Use a claimed company domain' });
  }
  async create(body: Body) {
    await this.validateCompany(body.companyId, body.email);
    uniqueIds(body.allergenIds, 'allergenIds'); uniqueIds(body.dietaryTagIds, 'dietaryTagIds');
    try { return publicEmployee(await this.txRunner.run(tx => this.repository.create(tx, body, normalizeEmail(body.email)))); }
    catch (error) { if (isUnique(error)) throw new ApiError('CONFLICT', 'Employee email is already in use', 409); throw error; }
  }
  async update(id: string, body: Partial<Body>) {
    const current = await this.requireEmployee(id);
    // Moving an employee preserves the existing email and does not recheck its domain.
    await this.validateCompany(body.companyId ?? current.companyId, body.email);
    if (body.allergenIds) uniqueIds(body.allergenIds, 'allergenIds');
    if (body.dietaryTagIds) uniqueIds(body.dietaryTagIds, 'dietaryTagIds');
    try { return publicEmployee(await this.txRunner.run(tx => this.repository.update(tx, id, body, body.email ? normalizeEmail(body.email) : undefined))); }
    catch (error) { if (isUnique(error)) throw new ApiError('CONFLICT', 'Employee email is already in use', 409); throw error; }
  }
}
