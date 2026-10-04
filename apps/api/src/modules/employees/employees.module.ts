import { Module } from '@nestjs/common';
import { EMPLOYEE_PORT, StubEmployeePort } from './ports.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
@Module({
  controllers: [EmployeesController],
  providers: [
    EmployeesService,
    EmployeesRepository,
    { provide: EMPLOYEE_PORT, useClass: StubEmployeePort },
  ],
  exports: [EMPLOYEE_PORT],
})
export class EmployeesModule {}
