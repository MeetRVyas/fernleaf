import { Inject, Injectable } from '@nestjs/common';
import { PricingRepository } from './pricing.repository.js';
import { CATALOGUE_PORT, type CataloguePort } from '../catalogue/index.js';
import { COMPANY_PORT, type CompanyPort } from '../companies/index.js';
import { TxRunner } from '../../core/tx-runner.js';
import { ApiError } from '../../core/api-error.js';
import {
  entryKey,
  priceKey,
  resolvePrice,
  validateTierGraph,
  type PriceSubject,
  type TierRule,
} from './domain/price-rules.js';
import type { PricingPort, SubjectRef } from './ports.js';
import type { z } from 'zod';
import type { priceTierBody, priceRow, getTierPrices } from '@fernleaf/shared';
type TierBody = z.infer<typeof priceTierBody>;
type PriceRow = z.infer<typeof priceRow>;
type PriceQuery = z.infer<NonNullable<typeof getTierPrices.query>>;
@Injectable()
export class PricingService implements PricingPort {
  constructor(
    @Inject(PricingRepository) private readonly repository: PricingRepository,
    @Inject(TxRunner) private readonly txRunner: TxRunner,
    @Inject(CATALOGUE_PORT) private readonly catalogue: CataloguePort,
    @Inject(COMPANY_PORT) private readonly companies: CompanyPort,
  ) {}
  listTiers() {
    return this.repository.tiers();
  }
  private checkRule(body: TierBody): void {
    const valid =
      body.derivationKind === 'NONE'
        ? body.factorMilli === null &&
          body.baseTierId === null &&
          body.percentBp === null
        : body.derivationKind === 'COST_MULTIPLIER'
          ? body.factorMilli !== null &&
            body.factorMilli > 0 &&
            body.baseTierId === null &&
            body.percentBp === null
          : body.factorMilli === null &&
            body.baseTierId !== null &&
            body.percentBp !== null &&
            body.percentBp > -10000;
    if (!valid || (body.isDefault && !body.isActive))
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid tier derivation or default status',
        422,
      );
  }
  private checkGraph(id: string, tiers: TierRule[]): void {
    const graph = new Map(tiers.map((tier) => [tier.id, tier]));
    try {
      for (const tier of tiers) validateTierGraph(tier.id, graph);
    } catch (error) {
      throw new ApiError(
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : 'Invalid tier graph',
        422,
      );
    }
    if (!graph.has(id)) throw new ApiError('NOT_FOUND', 'Tier not found', 404);
  }
  createTier(body: TierBody) {
    this.checkRule(body);
    return this.txRunner.run(async (tx) => {
      const tiers = await this.repository.tiers(tx);
      if (tiers.length === 0 && !body.isDefault)
        throw new ApiError(
          'VALIDATION_ERROR',
          'The first tier must be the default',
          422,
        );
      if (
        tiers.some(
          (tier) =>
            tier.name === body.name || (body.isDefault && tier.isDefault),
        )
      )
        throw new ApiError('CONFLICT', 'Tier name or default is taken', 409);
      const created = await this.repository.createTier(tx, body);
      this.checkGraph(created.id, [...tiers, created]);
      return created;
    });
  }
  updateTier(id: string, patch: Partial<TierBody>) {
    return this.txRunner.run(async (tx) => {
      const tiers = await this.repository.tiers(tx);
      const old = tiers.find((tier) => tier.id === id);
      if (!old) throw new ApiError('NOT_FOUND', 'Tier not found', 404);
      const next = { ...old, ...patch };
      this.checkRule(next);
      if (old.isDefault && (!next.isDefault || !next.isActive))
        throw new ApiError(
          'VALIDATION_ERROR',
          'Default tier cannot be deactivated',
          422,
        );
      if (
        tiers.some(
          (tier) =>
            tier.id !== id &&
            (tier.name === next.name || (next.isDefault && tier.isDefault)),
        )
      )
        throw new ApiError('CONFLICT', 'Tier name or default is taken', 409);
      this.checkGraph(
        id,
        tiers.map((tier) => (tier.id === id ? next : tier)),
      );
      return this.repository.updateTier(tx, id, patch);
    });
  }
  async effectiveTierId(companyId: string): Promise<string> {
    const company = await this.companies.get(companyId);
    if (!company || !company.isActive)
      throw new ApiError('NOT_FOUND', 'Company not found', 404);
    if (company.tierId) {
      const assigned = await this.repository.tier(company.tierId);
      if (!assigned || !assigned.isActive)
        throw new ApiError(
          'VALIDATION_ERROR',
          'Assigned tier is inactive',
          422,
        );
      return assigned.id;
    }
    const tier = await this.repository.defaultTier();
    if (!tier) throw new ApiError('VALIDATION_ERROR', 'No default tier', 422);
    return tier.id;
  }
  private async pricingData(tierId: string, subjects: PriceSubject[]) {
    const tiers = await this.repository.tiers();
    if (!tiers.some((tier) => tier.id === tierId))
      throw new ApiError('NOT_FOUND', 'Tier not found', 404);
    const entries = await this.repository.entries(
      tiers.map((tier) => tier.id),
      subjects,
    );
    return {
      graph: new Map(tiers.map((tier) => [tier.id, tier])),
      manual: new Map(
        entries.map((entry) => [
          entryKey(entry.tierId, {
            type: entry.subjectType,
            id: entry.subjectId,
            costCents: 0,
          }),
          entry.priceCents,
        ]),
      ),
    };
  }
  async resolve(
    tierId: string,
    subjects: SubjectRef[],
  ): Promise<Map<string, number | null>> {
    const { graph, manual } = await this.pricingData(tierId, subjects);
    return new Map(
      subjects.map((subject) => [
        priceKey(subject.type, subject.id),
        resolvePrice(tierId, subject, graph, manual).priceCents,
      ]),
    );
  }
  private async subject(
    type: PriceSubject['type'],
    id: string,
  ): Promise<{ subject: PriceSubject; name: string }> {
    if (type === 'DISH') {
      const dish = await this.catalogue.getDish(id);
      if (!dish) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
      return {
        subject: { type, id, costCents: dish.costCents },
        name: dish.name,
      };
    }
    const option = (await this.catalogue.getOptions([id]))[0];
    if (!option) throw new ApiError('NOT_FOUND', 'Option not found', 404);
    return {
      subject: { type, id, costCents: option.costCents },
      name: option.name,
    };
  }
  async setManualPrice(
    tierId: string,
    type: PriceSubject['type'],
    id: string,
    priceCents: number,
  ): Promise<PriceRow> {
    if (type === 'DISH' && priceCents === 0)
      throw new ApiError(
        'VALIDATION_ERROR',
        'Dish price must be positive',
        422,
      );
    if (!(await this.repository.tier(tierId)))
      throw new ApiError('NOT_FOUND', 'Tier not found', 404);
    const { subject, name } = await this.subject(type, id);
    await this.txRunner.run((tx) =>
      this.repository.upsertEntry(tx, tierId, subject, priceCents),
    );
    return {
      subjectType: type,
      subjectId: id,
      name,
      priceCents,
      source: 'MANUAL',
    };
  }
  async clearManualPrice(
    tierId: string,
    type: PriceSubject['type'],
    id: string,
  ) {
    const deleted = await this.txRunner.run((tx) =>
      this.repository.deleteEntry(tx, tierId, type, id),
    );
    if (deleted.count === 0)
      throw new ApiError('NOT_FOUND', 'Manual price not found', 404);
    return { ok: true as const };
  }
  async getTierPrices(tierId: string, query: PriceQuery) {
    if (!(await this.repository.tier(tierId)))
      throw new ApiError('NOT_FOUND', 'Tier not found', 404);
    // CataloguePort currently lacks a list operation; discover subjects from all tiers' entries.
    const tiers = await this.repository.tiers();
    const known = await this.repository.entries(tiers.map((item) => item.id));
    const unique = [
      ...new Map(
        known.map((entry) => [
          priceKey(entry.subjectType, entry.subjectId),
          entry,
        ]),
      ).values(),
    ];
    const subjects = await Promise.all(
      unique.map((entry) => this.subject(entry.subjectType, entry.subjectId)),
    );
    const { graph, manual } = await this.pricingData(
      tierId,
      subjects.map((item) => item.subject),
    );
    const rows: PriceRow[] = subjects
      .map(({ subject, name }) => ({
        subjectType: subject.type,
        subjectId: subject.id,
        name,
        ...resolvePrice(tierId, subject, graph, manual),
      }))
      .filter(
        (row) =>
          (!query.missingOnly || row.source === 'MISSING') &&
          (!query.subjectType || row.subjectType === query.subjectType),
      )
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) ||
          left.subjectId.localeCompare(right.subjectId),
      );
    const page = query.page ?? 1,
      pageSize = query.pageSize ?? 25;
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      pageSize,
    };
  }
}
