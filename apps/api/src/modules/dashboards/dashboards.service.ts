import { Inject, Injectable } from '@nestjs/common';
import { DashboardsRepository } from './dashboards.repository.js';
@Injectable()
export class DashboardsService {
  constructor(
    @Inject(DashboardsRepository)
    private readonly repository: DashboardsRepository,
  ) {}
}
