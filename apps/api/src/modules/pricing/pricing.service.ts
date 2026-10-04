import { Inject, Injectable } from '@nestjs/common';
import { PricingRepository } from './pricing.repository.js';
@Injectable()
export class PricingService {
  constructor(
    @Inject(PricingRepository) private readonly repository: PricingRepository,
  ) {}
}
