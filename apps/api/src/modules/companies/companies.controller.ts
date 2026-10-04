import { Controller } from '@nestjs/common';
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  createCompanyAddress,
  updateCompanyAddress,
  listCompanyHolidays,
  createCompanyHoliday,
  deleteCompanyHoliday,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class CompaniesController {
  @Route(listCompanies) listCompanies(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.listCompanies is not implemented',
      501,
    );
  }
  @Route(getCompany) getCompany(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.getCompany is not implemented',
      501,
    );
  }
  @Route(createCompany) createCompany(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.createCompany is not implemented',
      501,
    );
  }
  @Route(updateCompany) updateCompany(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.updateCompany is not implemented',
      501,
    );
  }
  @Route(createCompanyAddress) createCompanyAddress(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.createCompanyAddress is not implemented',
      501,
    );
  }
  @Route(updateCompanyAddress) updateCompanyAddress(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.updateCompanyAddress is not implemented',
      501,
    );
  }
  @Route(listCompanyHolidays) listCompanyHolidays(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.listCompanyHolidays is not implemented',
      501,
    );
  }
  @Route(createCompanyHoliday) createCompanyHoliday(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.createCompanyHoliday is not implemented',
      501,
    );
  }
  @Route(deleteCompanyHoliday) deleteCompanyHoliday(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'companies.deleteCompanyHoliday is not implemented',
      501,
    );
  }
}
