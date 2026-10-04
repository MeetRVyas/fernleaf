import { Controller } from '@nestjs/common';
import {
  adminDashboard,
  kitchenDashboard,
  dispatchDashboard,
  driverDashboard,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class DashboardsController {
  @Route(adminDashboard) adminDashboard(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dashboards.adminDashboard is not implemented',
      501,
    );
  }
  @Route(kitchenDashboard) kitchenDashboard(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dashboards.kitchenDashboard is not implemented',
      501,
    );
  }
  @Route(dispatchDashboard) dispatchDashboard(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dashboards.dispatchDashboard is not implemented',
      501,
    );
  }
  @Route(driverDashboard) driverDashboard(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dashboards.driverDashboard is not implemented',
      501,
    );
  }
}
