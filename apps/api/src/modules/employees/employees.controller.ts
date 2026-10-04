import { Controller, Inject } from '@nestjs/common';
import { listEmployees, getEmployee, createEmployee, updateEmployee, type InputOf } from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { EmployeesService } from './employees.service.js';
@Controller()
export class EmployeesController {
  constructor(@Inject(EmployeesService) private readonly service: EmployeesService) {}
  @Route(listEmployees) list(@Input() input: InputOf<typeof listEmployees>) { return this.service.list(input.query); }
  @Route(getEmployee) get(@Input() input: InputOf<typeof getEmployee>) { return this.service.requireEmployee(input.params.id); }
  @Route(createEmployee) create(@Input() input: InputOf<typeof createEmployee>) { return this.service.create(input.body); }
  @Route(updateEmployee) update(@Input() input: InputOf<typeof updateEmployee>) { return this.service.update(input.params.id, input.body); }
}
