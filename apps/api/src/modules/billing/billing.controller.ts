import { Controller } from '@nestjs/common';
import {
  listBillableOrders,
  listInvoices,
  getInvoice,
  createInvoice,
  markInvoicePaid,
  voidInvoice,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class BillingController {
  @Route(listBillableOrders) listBillableOrders(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.listBillableOrders is not implemented',
      501,
    );
  }
  @Route(listInvoices) listInvoices(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.listInvoices is not implemented',
      501,
    );
  }
  @Route(getInvoice) getInvoice(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.getInvoice is not implemented',
      501,
    );
  }
  @Route(createInvoice) createInvoice(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.createInvoice is not implemented',
      501,
    );
  }
  @Route(markInvoicePaid) markInvoicePaid(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.markInvoicePaid is not implemented',
      501,
    );
  }
  @Route(voidInvoice) voidInvoice(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'billing.voidInvoice is not implemented',
      501,
    );
  }
}
