import { Module } from '@nestjs/common';
import { COMPANY_PORT, StubCompanyPort } from './ports.js';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';
import { CompaniesRepository } from './companies.repository.js';
@Module({
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompaniesRepository,
    { provide: COMPANY_PORT, useClass: StubCompanyPort },
  ],
  exports: [COMPANY_PORT],
})
export class CompaniesModule {}
