import { Module } from '@nestjs/common';
import { KITCHEN_PORT, StubKitchenPort } from './ports.js';
import { KitchenController } from './kitchen.controller.js';
import { KitchenService } from './kitchen.service.js';
import { KitchenRepository } from './kitchen.repository.js';
@Module({
  controllers: [KitchenController],
  providers: [
    KitchenService,
    KitchenRepository,
    { provide: KITCHEN_PORT, useClass: StubKitchenPort },
  ],
  exports: [KITCHEN_PORT],
})
export class KitchenModule {}
