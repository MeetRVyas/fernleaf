import { Inject, Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';
@Injectable()
export class OrdersService {
  constructor(
    @Inject(OrdersRepository) private readonly repository: OrdersRepository,
  ) {}
}
