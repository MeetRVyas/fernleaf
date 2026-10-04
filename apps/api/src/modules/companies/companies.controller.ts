import { Controller, Inject } from '@nestjs/common';
import { listCompanies, getCompany, createCompany, updateCompany, createCompanyAddress, updateCompanyAddress, listCompanyHolidays, createCompanyHoliday, deleteCompanyHoliday, type InputOf } from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { CompaniesService } from './companies.service.js';
@Controller()
export class CompaniesController {
  constructor(@Inject(CompaniesService) private readonly service: CompaniesService) {}
  @Route(listCompanies) list(@Input() input: InputOf<typeof listCompanies>) { return this.service.list(input.query); }
  @Route(getCompany) get(@Input() input: InputOf<typeof getCompany>) { return this.service.requireCompany(input.params.id); }
  @Route(createCompany) create(@Input() input: InputOf<typeof createCompany>) { return this.service.create(input.body); }
  @Route(updateCompany) update(@Input() input: InputOf<typeof updateCompany>) { return this.service.update(input.params.id, input.body); }
  @Route(createCompanyAddress) createAddress(@Input() input: InputOf<typeof createCompanyAddress>) { return this.service.createAddress(input.params.id, input.body); }
  @Route(updateCompanyAddress) updateAddress(@Input() input: InputOf<typeof updateCompanyAddress>) { return this.service.updateAddress(input.params.id, input.body); }
  @Route(listCompanyHolidays) listHolidays(@Input() input: InputOf<typeof listCompanyHolidays>) { return this.service.listHolidays(input.params.id); }
  @Route(createCompanyHoliday) createHoliday(@Input() input: InputOf<typeof createCompanyHoliday>) { return this.service.createHoliday(input.params.id, input.body.date, input.body.name); }
  @Route(deleteCompanyHoliday) deleteHoliday(@Input() input: InputOf<typeof deleteCompanyHoliday>) { return this.service.deleteHoliday(input.params.id); }
}
