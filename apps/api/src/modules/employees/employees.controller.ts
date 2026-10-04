import { Controller } from '@nestjs/common';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class EmployeesController {
  @Route(listEmployees) listEmployees(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'employees.listEmployees is not implemented',
      501,
    );
  }
  @Route(getEmployee) getEmployee(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'employees.getEmployee is not implemented',
      501,
    );
  }
  @Route(createEmployee) createEmployee(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'employees.createEmployee is not implemented',
      501,
    );
  }
  @Route(updateEmployee) updateEmployee(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'employees.updateEmployee is not implemented',
      501,
    );
  }
}
