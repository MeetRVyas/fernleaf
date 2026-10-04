import { Inject, Injectable } from '@nestjs/common';
import { KitchenRepository } from './kitchen.repository.js';
@Injectable()
export class KitchenService {
  constructor(
    @Inject(KitchenRepository) private readonly repository: KitchenRepository,
  ) {}
}
