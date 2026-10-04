import { Module } from '@nestjs/common';
import { CATALOGUE_PORT, StubCataloguePort } from './ports.js';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueService } from './catalogue.service.js';
import { CatalogueRepository } from './catalogue.repository.js';
@Module({
  controllers: [CatalogueController],
  providers: [
    CatalogueService,
    CatalogueRepository,
    { provide: CATALOGUE_PORT, useClass: StubCataloguePort },
  ],
  exports: [CATALOGUE_PORT],
})
export class CatalogueModule {}
