import { Module } from '@nestjs/common';
import { COMPANY_PORT } from './ports.js';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';
import { CompaniesRepository } from './companies.repository.js';
@Module({
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompaniesRepository,
    { provide: COMPANY_PORT, useExisting: CompaniesService },
  ],
  exports: [COMPANY_PORT],
})
export class CompaniesModule {}
