import { Inject, Injectable } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository.js';
@Injectable()
export class EmployeesService {
  constructor(
    @Inject(EmployeesRepository)
    private readonly repository: EmployeesRepository,
  ) {}
}
