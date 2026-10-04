import { Module } from '@nestjs/common';
import { ORDERS_PORT, StubOrdersPort } from './ports.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrdersRepository } from './orders.repository.js';
@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    { provide: ORDERS_PORT, useClass: StubOrdersPort },
  ],
  exports: [ORDERS_PORT],
})
export class OrdersModule {}
