import { Inject, Injectable } from '@nestjs/common';
import { dbDateToString, stringToDbDate, type InputOf, type createCompany, type listCompanies } from '@fernleaf/shared';
import { ApiError } from '../../core/api-error.js';
import { TxRunner } from '../../core/tx-runner.js';
import { CompaniesRepository } from './companies.repository.js';
import { allowsDelivery, normalizeDomains, validateWorkingDays } from './domain/company-rules.js';
import type { CompanyPort } from './ports.js';

type Body = InputOf<typeof createCompany>['body'];
type CompanyRow = NonNullable<Awaited<ReturnType<CompaniesRepository['get']>>>;
function publicCompany(row: CompanyRow) {
  return {
    id: row.id, name: row.name, tierId: row.tierId, defaultDeliveryTime: row.defaultDeliveryTime,
    deliveryLeadMinutes: row.deliveryLeadMinutes, defaultPackaging: row.defaultPackaging,
    driverInstructions: row.driverInstructions, defaultDriverId: row.defaultDriverId,
    billingName: row.billingName, billingEmail: row.billingEmail, billingPhone: row.billingPhone ?? '',
    billingAddress: row.billingAddress, ownerEmployeeId: row.ownerEmployeeId,
    workingDays: row.workingDays, domains: row.domains.map(item => item.domain),
    addresses: row.addresses.map(address => ({ id: address.id, companyId: address.companyId, label: address.label, line1: address.line1, line2: address.line2, city: address.city, region: address.region, postalCode: address.postalCode, country: address.country, isDefault: address.isDefault })),
    isActive: row.isActive,
  };
}
function normalizedDomains(domains: string[]): string[] {
  try { return normalizeDomains(domains); }
  catch (error) {
    if (error instanceof Error && error.message.includes('Public')) throw new ApiError('PUBLIC_DOMAIN_NOT_ALLOWED', error.message, 422);
    throw new ApiError('VALIDATION_ERROR', 'Invalid company domains', 422, { domains: error instanceof Error ? error.message : 'Invalid domains' });
  }
}
function validateBody(body: Partial<Body>): void {
  if (body.workingDays) {
    try { validateWorkingDays(body.workingDays); }
    catch { throw new ApiError('VALIDATION_ERROR', 'Invalid working days', 422, { workingDays: 'Choose distinct weekdays 1 through 7' }); }
  }
  if (body.addresses && (body.addresses.length < 1 || body.addresses.filter(address => address.isDefault).length !== 1)) throw new ApiError('VALIDATION_ERROR', 'Exactly one default address is required', 422, { addresses: 'Provide one default address' });
}
function isUnique(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'; }

@Injectable()
export class CompaniesService implements CompanyPort {
  constructor(@Inject(CompaniesRepository) private readonly repository: CompaniesRepository, @Inject(TxRunner) private readonly txRunner: TxRunner) {}
  async get(id: string) { const row = await this.repository.get(id); return row ? publicCompany(row) : null; }
  async getAddress(id: string) { const row = await this.repository.getAddress(id); return row ? { id: row.id, companyId: row.companyId, label: row.label, line1: row.line1, line2: row.line2, city: row.city, region: row.region, postalCode: row.postalCode, country: row.country, isDefault: row.isDefault } : null; }
  async requireCompany(id: string) { const company = await this.get(id); if (!company) throw new ApiError('NOT_FOUND', 'Company not found', 404); return company; }
  async list(query: InputOf<typeof listCompanies>['query']) {
    const result = await this.repository.list(query.page, query.pageSize, query.q, query.active, query.sort);
    return { ...result, items: result.items.map(publicCompany) };
  }
  async create(body: Body) {
    validateBody(body);
    const domains = normalizedDomains(body.domains);
    if (body.ownerEmployeeId) throw new ApiError('VALIDATION_ERROR', 'Owner can be assigned after company creation', 422);
    try { return publicCompany(await this.txRunner.run(tx => this.repository.create(tx, body, domains))); }
    catch (error) { if (isUnique(error)) throw new ApiError('DOMAIN_TAKEN', 'Company name or domain is already in use', 422); throw error; }
  }
  async update(id: string, body: Partial<Body>) {
    await this.requireCompany(id);
    validateBody(body);
    const domains = body.domains ? normalizedDomains(body.domains) : undefined;
    try { return publicCompany(await this.txRunner.run(async tx => {
      for (const domain of domains ?? []) {
        const owner = await this.repository.domainOwner(domain, tx);
        if (owner && owner.companyId !== id) throw new ApiError('DOMAIN_TAKEN', 'Company domain is already in use', 422);
      }
      return this.repository.update(tx, id, body, domains);
    })); }
    catch (error) { if (isUnique(error)) throw new ApiError('DOMAIN_TAKEN', 'Company name or domain is already in use', 422); throw error; }
  }
  async allowsDelivery(companyId: string, date: string): Promise<boolean> {
    const company = await this.get(companyId);
    if (!company || !company.isActive) return false;
    const holidays = await this.repository.holidays(companyId);
    return allowsDelivery(company.workingDays, date, holidays.map(item => dbDateToString(item.date)));
  }
  async createAddress(companyId: string, body: Body['addresses'][number]) {
    await this.requireCompany(companyId);
    return this.txRunner.run(async tx => {
      if (body.isDefault) await this.repository.unsetDefaultAddress(tx, companyId);
      return this.repository.createAddress(tx, companyId, body);
    });
  }
  async updateAddress(id: string, body: Partial<Body['addresses'][number]>) {
    const current = await this.repository.getAddress(id);
    if (!current) throw new ApiError('NOT_FOUND', 'Address not found', 404);
    if (current.isDefault && body.isDefault === false) throw new ApiError('VALIDATION_ERROR', 'A company needs a default address', 422);
    return this.txRunner.run(async tx => {
      if (body.isDefault) await this.repository.unsetDefaultAddress(tx, current.companyId);
      return this.repository.updateAddress(tx, id, body);
    });
  }
  async listHolidays(companyId: string) { await this.requireCompany(companyId); return (await this.repository.holidays(companyId)).map(row => ({ id: row.id, companyId: row.companyId, date: dbDateToString(row.date), name: row.name })); }
  async createHoliday(companyId: string, date: string, name: string) {
    await this.requireCompany(companyId);
    const row = await this.txRunner.run(async tx => {
      if (await this.repository.holidayOn(companyId, stringToDbDate(date), tx)) throw new ApiError('CONFLICT', 'Company holiday already exists', 409);
      return this.repository.createHoliday(tx, companyId, stringToDbDate(date), name);
    });
    return { id: row.id, companyId: row.companyId, date: dbDateToString(row.date), name: row.name };
  }
  async deleteHoliday(id: string) { const result = await this.txRunner.run(tx => this.repository.deleteHoliday(tx, id)); if (!result.count) throw new ApiError('NOT_FOUND', 'Holiday not found', 404); return { ok: true as const }; }
}
