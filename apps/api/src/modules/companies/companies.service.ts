import { Inject, Injectable } from '@nestjs/common';
import { CompaniesRepository } from './companies.repository.js';
@Injectable()
export class CompaniesService {
  constructor(
    @Inject(CompaniesRepository)
    private readonly repository: CompaniesRepository,
  ) {}
}
