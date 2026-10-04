import { Inject, Injectable } from '@nestjs/common';
import type { InputOf, createEmployee } from '@fernleaf/shared';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';

type Body = InputOf<typeof createEmployee>['body'];
const include = { allergens: true, dietaryTags: true } as const;
@Injectable()
export class EmployeesRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  get(id: string, tx?: Tx) { return (tx ?? this.db).employee.findUnique({ where: { id }, include }); }
  async list(page: number, pageSize: number, companyId?: string, q?: string, active?: boolean, sort = 'name:asc') {
    const where = { ...(companyId ? { companyId } : {}), ...(active === undefined ? {} : { isActive: active }), ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {}) };
    const orderBy = sort === 'name:desc' ? { name: 'desc' as const } : { name: 'asc' as const };
    const [items, total] = await Promise.all([this.db.employee.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }), this.db.employee.count({ where })]);
    return { items, total, page, pageSize };
  }
  create(tx: Tx, body: Body, email: string) {
    return tx.employee.create({ data: {
      companyId: body.companyId, name: body.name, email, phone: body.phone,
      canChooseAddress: body.canChooseAddress, canChangeDeliveryTime: body.canChangeDeliveryTime,
      canChangePackaging: body.canChangePackaging, isActive: body.isActive,
      allergens: { create: body.allergenIds.map(allergenId => ({ allergenId })) },
      dietaryTags: { create: body.dietaryTagIds.map(tagId => ({ tagId })) },
    }, include });
  }
  async update(tx: Tx, id: string, body: Partial<Body>, email?: string) {
    if (body.allergenIds) {
      await tx.employeeAllergen.deleteMany({ where: { employeeId: id } });
      await tx.employeeAllergen.createMany({ data: body.allergenIds.map(allergenId => ({ employeeId: id, allergenId })) });
    }
    if (body.dietaryTagIds) {
      await tx.employeeDietaryTag.deleteMany({ where: { employeeId: id } });
      await tx.employeeDietaryTag.createMany({ data: body.dietaryTagIds.map(tagId => ({ employeeId: id, tagId })) });
    }
    return tx.employee.update({ where: { id }, data: {
      companyId: body.companyId, name: body.name, email, phone: body.phone,
      canChooseAddress: body.canChooseAddress, canChangeDeliveryTime: body.canChangeDeliveryTime,
      canChangePackaging: body.canChangePackaging, isActive: body.isActive,
    }, include });
  }
}
