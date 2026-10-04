import { Module } from '@nestjs/common';
import { EMPLOYEE_PORT } from './ports.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { CompaniesModule } from '../companies/index.js';
@Module({
  imports: [CompaniesModule],
  controllers: [EmployeesController],
  providers: [
    EmployeesService,
    EmployeesRepository,
    { provide: EMPLOYEE_PORT, useExisting: EmployeesService },
  ],
  exports: [EMPLOYEE_PORT],
})
export class EmployeesModule {}
