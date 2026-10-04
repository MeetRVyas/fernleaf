import { Module } from '@nestjs/common';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  DiscoveryModule,
} from '@nestjs/core';
import { CoreModule } from './core/core.module.js';
import { ErrorFilter } from './core/error-filter.js';
import { PermissionGuard } from './core/permission-guard.js';
import { InputInterceptor } from './core/input-interceptor.js';
import { HealthController } from './core/health.controller.js';
import { AuthModule } from './modules/auth/index.js';
import { ContractAudit } from './core/contract-audit.js';
import { SettingsModule } from './modules/settings/index.js';
import { ReferenceModule } from './modules/reference/index.js';
import { CatalogueModule } from './modules/catalogue/index.js';
import { PricingModule } from './modules/pricing/index.js';
import { CompaniesModule } from './modules/companies/index.js';
import { EmployeesModule } from './modules/employees/index.js';
import { MenuModule } from './modules/menu/index.js';
import { OrdersModule } from './modules/orders/index.js';
import { KitchenModule } from './modules/kitchen/index.js';
import { DispatchModule } from './modules/dispatch/index.js';
import { BillingModule } from './modules/billing/index.js';
import { DashboardsModule } from './modules/dashboards/index.js';
@Module({
  imports: [
    DiscoveryModule,
    CoreModule,
    AuthModule,
    SettingsModule,
    ReferenceModule,
    CatalogueModule,
    PricingModule,
    CompaniesModule,
    EmployeesModule,
    MenuModule,
    OrdersModule,
    KitchenModule,
    DispatchModule,
    BillingModule,
    DashboardsModule,
  ],
  controllers: [HealthController],
  providers: [
    ContractAudit,
    { provide: APP_FILTER, useClass: ErrorFilter },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_INTERCEPTOR, useClass: InputInterceptor },
  ],
})
export class AppModule {}
