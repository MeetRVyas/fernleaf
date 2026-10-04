import { Inject, Injectable } from '@nestjs/common';
import { CatalogueRepository } from './catalogue.repository.js';
@Injectable()
export class CatalogueService {
  constructor(
    @Inject(CatalogueRepository)
    private readonly repository: CatalogueRepository,
  ) {}
}
