import { Module } from '@nestjs/common';
import { CATALOGUE_PORT } from './ports.js';
import { ReferenceModule } from '../reference/index.js';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueService } from './catalogue.service.js';
import { CatalogueRepository } from './catalogue.repository.js';
@Module({
  imports: [ReferenceModule],
  controllers: [CatalogueController],
  providers: [
    CatalogueService,
    CatalogueRepository,
    { provide: CATALOGUE_PORT, useExisting: CatalogueService },
  ],
  exports: [CATALOGUE_PORT],
})
export class CatalogueModule {}
