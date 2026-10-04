import { Module } from '@nestjs/common';
import { PRICING_PORT, StubPricingPort } from './ports.js';
import { PricingController } from './pricing.controller.js';
import { PricingService } from './pricing.service.js';
import { PricingRepository } from './pricing.repository.js';
@Module({
  controllers: [PricingController],
  providers: [
    PricingService,
    PricingRepository,
    { provide: PRICING_PORT, useClass: StubPricingPort },
  ],
  exports: [PRICING_PORT],
})
export class PricingModule {}
