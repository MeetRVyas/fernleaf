import { Inject, Injectable } from '@nestjs/common';
import type { InputOf, createCompany, updateCompanyAddress } from '@fernleaf/shared';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';

const include = { domains: true, addresses: true } as const;
type CompanyBody = InputOf<typeof createCompany>['body'];
type AddressPatch = InputOf<typeof updateCompanyAddress>['body'];

@Injectable()
export class CompaniesRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  get(id: string, tx?: Tx) { return (tx ?? this.db).company.findUnique({ where: { id }, include }); }
  getAddress(id: string, tx?: Tx) { return (tx ?? this.db).companyAddress.findUnique({ where: { id } }); }
  async list(page: number, pageSize: number, q?: string, active?: boolean, sort = 'name:asc') {
    const where = { ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}), ...(active === undefined ? {} : { isActive: active }) };
    const orderBy = sort === 'name:desc' ? { name: 'desc' as const } : { name: 'asc' as const };
    const [items, total] = await Promise.all([this.db.company.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }), this.db.company.count({ where })]);
    return { items, total, page, pageSize };
  }
  domainOwner(domain: string, tx: Tx) { return tx.companyDomain.findUnique({ where: { domain } }); }
  create(tx: Tx, body: CompanyBody, domains: string[]) {
    return tx.company.create({ data: {
      name: body.name, tierId: body.tierId, defaultDeliveryTime: body.defaultDeliveryTime, deliveryLeadMinutes: body.deliveryLeadMinutes,
      defaultPackaging: body.defaultPackaging, driverInstructions: body.driverInstructions, defaultDriverId: body.defaultDriverId,
      billingName: body.billingName, billingEmail: body.billingEmail.toLowerCase(), billingPhone: body.billingPhone,
      billingAddress: body.billingAddress, workingDays: body.workingDays, isActive: body.isActive,
      domains: { create: domains.map(domain => ({ domain })) }, addresses: { create: body.addresses },
    }, include });
  }
  async update(tx: Tx, id: string, body: Partial<CompanyBody>, domains?: string[]) {
    if (domains) {
      await tx.companyDomain.deleteMany({ where: { companyId: id, domain: { notIn: domains } } });
      for (const domain of domains) await tx.companyDomain.upsert({ where: { domain }, create: { companyId: id, domain }, update: {} });
    }
    if (body.addresses) {
      await tx.companyAddress.deleteMany({ where: { companyId: id } });
      await tx.companyAddress.createMany({ data: body.addresses.map(address => ({ ...address, companyId: id })) });
    }
    return tx.company.update({ where: { id }, data: {
      name: body.name, tierId: body.tierId, defaultDeliveryTime: body.defaultDeliveryTime,
      deliveryLeadMinutes: body.deliveryLeadMinutes, defaultPackaging: body.defaultPackaging,
      driverInstructions: body.driverInstructions, defaultDriverId: body.defaultDriverId,
      billingName: body.billingName, billingEmail: body.billingEmail?.toLowerCase(),
      billingPhone: body.billingPhone, billingAddress: body.billingAddress,
      workingDays: body.workingDays, isActive: body.isActive,
    }, include });
  }
  setOwner(tx: Tx, id: string, ownerEmployeeId: string | null) { return tx.company.update({ where: { id }, data: { ownerEmployeeId }, include }); }
  unsetDefaultAddress(tx: Tx, companyId: string) { return tx.companyAddress.updateMany({ where: { companyId, isDefault: true }, data: { isDefault: false } }); }
  createAddress(tx: Tx, companyId: string, body: CompanyBody['addresses'][number]) { return tx.companyAddress.create({ data: { ...body, companyId } }); }
  updateAddress(tx: Tx, id: string, body: AddressPatch) { return tx.companyAddress.update({ where: { id }, data: body }); }
  holidays(companyId: string) { return this.db.companyHoliday.findMany({ where: { companyId }, orderBy: { date: 'asc' } }); }
  holidayOn(companyId: string, date: Date, tx?: Tx) { return (tx ?? this.db).companyHoliday.findUnique({ where: { companyId_date: { companyId, date } } }); }
  createHoliday(tx: Tx, companyId: string, date: Date, name: string) { return tx.companyHoliday.create({ data: { companyId, date, name } }); }
  deleteHoliday(tx: Tx, id: string) { return tx.companyHoliday.deleteMany({ where: { id } }); }
}
