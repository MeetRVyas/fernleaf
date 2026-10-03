import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, DiscoveryModule } from '@nestjs/core';
import { CoreModule } from './core/core.module.js';
import { ErrorFilter } from './core/error-filter.js';
import { PermissionGuard } from './core/permission-guard.js';
import { InputInterceptor } from './core/input-interceptor.js';
import { HealthController } from './core/health.controller.js';
import { AuthModule } from './modules/auth/index.js';
import { ContractAudit } from './core/contract-audit.js';
@Module({ imports: [DiscoveryModule, CoreModule, AuthModule], controllers: [HealthController], providers: [ContractAudit, { provide: APP_FILTER, useClass: ErrorFilter }, { provide: APP_GUARD, useClass: PermissionGuard }, { provide: APP_INTERCEPTOR, useClass: InputInterceptor }] })
export class AppModule {}
