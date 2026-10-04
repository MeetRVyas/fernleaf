import { Inject, Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository.js';
@Injectable()
export class BillingService {
  constructor(
    @Inject(BillingRepository) private readonly repository: BillingRepository,
  ) {}
}
