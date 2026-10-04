import { Controller } from '@nestjs/common';
import {
  listOrders,
  getOrder,
  createOrder,
  replaceOrderLines,
  updateOrderDelivery,
  placeOrder,
  cancelOrder,
  rejectOrder,
  processCutoff,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class OrdersController {
  @Route(listOrders) listOrders(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.listOrders is not implemented',
      501,
    );
  }
  @Route(getOrder) getOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.getOrder is not implemented',
      501,
    );
  }
  @Route(createOrder) createOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.createOrder is not implemented',
      501,
    );
  }
  @Route(replaceOrderLines) replaceOrderLines(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.replaceOrderLines is not implemented',
      501,
    );
  }
  @Route(updateOrderDelivery) updateOrderDelivery(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.updateOrderDelivery is not implemented',
      501,
    );
  }
  @Route(placeOrder) placeOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.placeOrder is not implemented',
      501,
    );
  }
  @Route(cancelOrder) cancelOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.cancelOrder is not implemented',
      501,
    );
  }
  @Route(rejectOrder) rejectOrder(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.rejectOrder is not implemented',
      501,
    );
  }
  @Route(processCutoff) processCutoff(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'orders.processCutoff is not implemented',
      501,
    );
  }
}
