import { Module } from '@nestjs/common';
import { DISPATCH_PORT, StubDispatchPort } from './ports.js';
import { DispatchController } from './dispatch.controller.js';
import { DispatchService } from './dispatch.service.js';
import { DispatchRepository } from './dispatch.repository.js';
@Module({
  controllers: [DispatchController],
  providers: [
    DispatchService,
    DispatchRepository,
    { provide: DISPATCH_PORT, useClass: StubDispatchPort },
  ],
  exports: [DISPATCH_PORT],
})
export class DispatchModule {}
