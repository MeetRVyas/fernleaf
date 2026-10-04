import { Controller } from '@nestjs/common';
import {
  getKitchenBoard,
  startPrepUnit,
  finishPrepUnit,
  forceCompleteOrder,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class KitchenController {
  @Route(getKitchenBoard) getKitchenBoard(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'kitchen.getKitchenBoard is not implemented',
      501,
    );
  }
  @Route(startPrepUnit) startPrepUnit(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'kitchen.startPrepUnit is not implemented',
      501,
    );
  }
  @Route(finishPrepUnit) finishPrepUnit(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'kitchen.finishPrepUnit is not implemented',
      501,
    );
  }
  @Route(forceCompleteOrder) forceCompleteOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'kitchen.forceCompleteOrder is not implemented',
      501,
    );
  }
}
