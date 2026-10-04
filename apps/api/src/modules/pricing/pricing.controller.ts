import { Controller, Inject } from '@nestjs/common';
import {
  listTiers,
  createTier,
  updateTier,
  getTierPrices,
  setManualPrice,
  clearManualPrice,
} from '@fernleaf/shared';
import { Route, Input, type ContractInput } from '../../core/route.js';
import { PricingService } from './pricing.service.js';
@Controller()
export class PricingController {
  constructor(@Inject(PricingService) private readonly service: PricingService) {}
  @Route(listTiers) listTiers() { return this.service.listTiers(); }
  @Route(createTier) createTier(@Input() input: ContractInput<typeof createTier>) { return this.service.createTier(input.body); }
  @Route(updateTier) updateTier(@Input() input: ContractInput<typeof updateTier>) { return this.service.updateTier(input.params.id, input.body); }
  @Route(getTierPrices) getTierPrices(@Input() input: ContractInput<typeof getTierPrices>) { return this.service.getTierPrices(input.params.id, input.query); }
  @Route(setManualPrice) setManualPrice(@Input() input: ContractInput<typeof setManualPrice>) { return this.service.setManualPrice(input.params.id, input.body.subjectType, input.body.subjectId, input.body.priceCents); }
  @Route(clearManualPrice) clearManualPrice(@Input() input: ContractInput<typeof clearManualPrice>) { return this.service.clearManualPrice(input.params.id, input.params.subjectType, input.params.subjectId); }
}
