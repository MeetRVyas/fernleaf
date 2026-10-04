import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller.js';
import { ReferenceService } from './reference.service.js';
import { ReferenceRepository } from './reference.repository.js';
import { REFERENCE_PORT } from './ports.js';
@Module({
  controllers: [ReferenceController],
  providers: [ReferenceService, ReferenceRepository, { provide: REFERENCE_PORT, useExisting: ReferenceService }],
  exports: [REFERENCE_PORT],
})
export class ReferenceModule {}
