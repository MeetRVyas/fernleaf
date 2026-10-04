import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';
import type { PriceSubject } from './domain/price-rules.js';
@Injectable()
export class PricingRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  tiers(tx?: Tx) { return (tx ?? this.db).priceTier.findMany({ orderBy: { name: 'asc' } }); }
  tier(id: string, tx?: Tx) { return (tx ?? this.db).priceTier.findUnique({ where: { id } }); }
  defaultTier() { return this.db.priceTier.findFirst({ where: { isDefault: true, isActive: true } }); }
  createTier(tx: Tx, data: { name: string; isDefault: boolean; isActive: boolean; derivationKind: 'NONE' | 'COST_MULTIPLIER' | 'PERCENT_OVER_TIER'; factorMilli: number | null; baseTierId: string | null; percentBp: number | null }) { return tx.priceTier.create({ data }); }
  updateTier(tx: Tx, id: string, data: Partial<{ name: string; isDefault: boolean; isActive: boolean; derivationKind: 'NONE' | 'COST_MULTIPLIER' | 'PERCENT_OVER_TIER'; factorMilli: number | null; baseTierId: string | null; percentBp: number | null }>) { return tx.priceTier.update({ where: { id }, data }); }
  entries(tierIds: string[], subjects?: PriceSubject[]) { return this.db.priceEntry.findMany({ where: { tierId: { in: tierIds }, ...(subjects ? { OR: subjects.map(subject => ({ subjectType: subject.type, subjectId: subject.id })) } : {}) } }); }
  upsertEntry(tx: Tx, tierId: string, subject: PriceSubject, priceCents: number) { return tx.priceEntry.upsert({ where: { tierId_subjectType_subjectId: { tierId, subjectType: subject.type, subjectId: subject.id } }, update: { priceCents }, create: { tierId, subjectType: subject.type, subjectId: subject.id, priceCents } }); }
  deleteEntry(tx: Tx, tierId: string, type: PriceSubject['type'], subjectId: string) { return tx.priceEntry.deleteMany({ where: { tierId, subjectType: type, subjectId } }); }
}
