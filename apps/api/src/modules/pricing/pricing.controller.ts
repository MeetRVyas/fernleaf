import { Controller } from '@nestjs/common';
import {
  listTiers,
  createTier,
  updateTier,
  getTierPrices,
  setManualPrice,
  clearManualPrice,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class PricingController {
  @Route(listTiers) listTiers(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.listTiers is not implemented',
      501,
    );
  }
  @Route(createTier) createTier(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.createTier is not implemented',
      501,
    );
  }
  @Route(updateTier) updateTier(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.updateTier is not implemented',
      501,
    );
  }
  @Route(getTierPrices) getTierPrices(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.getTierPrices is not implemented',
      501,
    );
  }
  @Route(setManualPrice) setManualPrice(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.setManualPrice is not implemented',
      501,
    );
  }
  @Route(clearManualPrice) clearManualPrice(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'pricing.clearManualPrice is not implemented',
      501,
    );
  }
}
