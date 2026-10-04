import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';
export type ReferenceKind = 'allergen' | 'dietaryTag' | 'kitchenStation';
@Injectable()
export class ReferenceRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(kind: ReferenceKind, skip: number, take: number, sort: 'asc' | 'desc') {
    const orderBy = { name: sort } as const;
    if (kind === 'allergen') return this.db.allergen.findMany({ skip, take, orderBy });
    if (kind === 'dietaryTag') return this.db.dietaryTag.findMany({ skip, take, orderBy });
    return this.db.kitchenStation.findMany({ skip, take, orderBy });
  }

  async count(kind: ReferenceKind) {
    if (kind === 'allergen') return this.db.allergen.count();
    if (kind === 'dietaryTag') return this.db.dietaryTag.count();
    return this.db.kitchenStation.count();
  }

  async find(tx: Tx, kind: ReferenceKind, id: string) {
    if (kind === 'allergen') return tx.allergen.findUnique({ where: { id } });
    if (kind === 'dietaryTag') return tx.dietaryTag.findUnique({ where: { id } });
    return tx.kitchenStation.findUnique({ where: { id } });
  }

  async findByName(tx: Tx, kind: ReferenceKind, name: string) {
    if (kind === 'allergen') return tx.allergen.findUnique({ where: { name } });
    if (kind === 'dietaryTag') return tx.dietaryTag.findUnique({ where: { name } });
    return tx.kitchenStation.findUnique({ where: { name } });
  }

  async create(tx: Tx, kind: ReferenceKind, name: string) {
    if (kind === 'allergen') return tx.allergen.create({ data: { name } });
    if (kind === 'dietaryTag') return tx.dietaryTag.create({ data: { name } });
    return tx.kitchenStation.create({ data: { name } });
  }

  async update(tx: Tx, kind: ReferenceKind, id: string, name: string) {
    if (kind === 'allergen') return tx.allergen.update({ where: { id }, data: { name } });
    if (kind === 'dietaryTag') return tx.dietaryTag.update({ where: { id }, data: { name } });
    return tx.kitchenStation.update({ where: { id }, data: { name } });
  }
}
