import { Controller } from '@nestjs/common';
import {
  listDrops,
  getDrop,
  assignDriver,
  markDispatchReady,
  markOutForDelivery,
  markDropDispatchReady,
  markDropOut,
  deliverDrop,
  listMyDrops,
  deliverMyDrop,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class DispatchController {
  @Route(listDrops) listDrops(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.listDrops is not implemented',
      501,
    );
  }
  @Route(getDrop) getDrop(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.getDrop is not implemented',
      501,
    );
  }
  @Route(assignDriver) assignDriver(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.assignDriver is not implemented',
      501,
    );
  }
  @Route(markDispatchReady) markDispatchReady(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.markDispatchReady is not implemented',
      501,
    );
  }
  @Route(markOutForDelivery) markOutForDelivery(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.markOutForDelivery is not implemented',
      501,
    );
  }
  @Route(markDropDispatchReady) markDropDispatchReady(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.markDropDispatchReady is not implemented',
      501,
    );
  }
  @Route(markDropOut) markDropOut(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.markDropOut is not implemented',
      501,
    );
  }
  @Route(deliverDrop) deliverDrop(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.deliverDrop is not implemented',
      501,
    );
  }
  @Route(listMyDrops) listMyDrops(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.listMyDrops is not implemented',
      501,
    );
  }
  @Route(deliverMyDrop) deliverMyDrop(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'dispatch.deliverMyDrop is not implemented',
      501,
    );
  }
}
