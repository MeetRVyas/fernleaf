import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller.js';
import { DashboardsService } from './dashboards.service.js';
import { DashboardsRepository } from './dashboards.repository.js';
@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardsRepository],
})
export class DashboardsModule {}
