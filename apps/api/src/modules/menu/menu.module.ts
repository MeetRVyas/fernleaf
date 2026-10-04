import { Module } from '@nestjs/common';
import { MENU_PORT } from './ports.js';
import { CatalogueModule } from '../catalogue/index.js';
import { PricingModule } from '../pricing/index.js';
import { CompaniesModule } from '../companies/index.js';
import { EmployeesModule } from '../employees/index.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { MenuRepository } from './menu.repository.js';
@Module({
  imports: [CatalogueModule, PricingModule, CompaniesModule, EmployeesModule],
  controllers: [MenuController],
  providers: [
    MenuService,
    MenuRepository,
    { provide: MENU_PORT, useExisting: MenuService },
  ],
  exports: [MENU_PORT],
})
export class MenuModule {}
