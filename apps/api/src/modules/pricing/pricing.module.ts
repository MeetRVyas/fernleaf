import { Module } from '@nestjs/common';
import { PRICING_PORT } from './ports.js';
import { CatalogueModule } from '../catalogue/index.js';
import { CompaniesModule } from '../companies/index.js';
import { PricingController } from './pricing.controller.js';
import { PricingService } from './pricing.service.js';
import { PricingRepository } from './pricing.repository.js';
@Module({
  imports: [CatalogueModule, CompaniesModule],
  controllers: [PricingController],
  providers: [
    PricingService,
    PricingRepository,
    { provide: PRICING_PORT, useExisting: PricingService },
  ],
  exports: [PRICING_PORT],
})
export class PricingModule {}
