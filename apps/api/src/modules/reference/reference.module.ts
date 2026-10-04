import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller.js';
import { ReferenceService } from './reference.service.js';
import { ReferenceRepository } from './reference.repository.js';
@Module({
  controllers: [ReferenceController],
  providers: [ReferenceService, ReferenceRepository],
})
export class ReferenceModule {}
