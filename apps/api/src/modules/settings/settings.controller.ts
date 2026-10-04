import { Controller } from '@nestjs/common';
import {
  listSettings,
  updateSetting,
  listKitchenHolidays,
  createKitchenHoliday,
  deleteKitchenHoliday,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class SettingsController {
  @Route(listSettings) listSettings(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'settings.listSettings is not implemented',
      501,
    );
  }
  @Route(updateSetting) updateSetting(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'settings.updateSetting is not implemented',
      501,
    );
  }
  @Route(listKitchenHolidays) listKitchenHolidays(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'settings.listKitchenHolidays is not implemented',
      501,
    );
  }
  @Route(createKitchenHoliday) createKitchenHoliday(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'settings.createKitchenHoliday is not implemented',
      501,
    );
  }
  @Route(deleteKitchenHoliday) deleteKitchenHoliday(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'settings.deleteKitchenHoliday is not implemented',
      501,
    );
  }
}
