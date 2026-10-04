import type { z } from 'zod';
import { orderSummary, orderEventType } from '@fernleaf/shared';
import type { Tx } from '../../core/tx-runner.js';
export type OrderSummary = z.infer<typeof orderSummary>;
export type OrderEventType = z.infer<typeof orderEventType>;
export const STUB_ORDER_ID = '00000000-0000-4000-8000-000000000051';
export const fixtureOrderSummary: OrderSummary = {
  id: STUB_ORDER_ID,
  orderNumber: 1,
  employeeId: '00000000-0000-4000-8000-000000000031',
  companyId: '00000000-0000-4000-8000-000000000021',
  status: 'CONFIRMED',
  deliveryDate: '2026-10-07',
  deliveryTime: '12:00',
  totalCents: 215,
  version: 1,
  invoiceId: null,
};
export interface OrdersPort {
  get(ids: string[]): Promise<OrderSummary[]>;
  lockOrder(tx: Tx, id: string): Promise<void>;
  recordEvent(
    tx: Tx,
    orderId: string,
    type: OrderEventType,
    actorId: string | null,
    meta?: object,
  ): Promise<void>;
  markDelivered(tx: Tx, orderIds: string[]): Promise<void>;
  attachToInvoice(
    tx: Tx,
    orderIds: string[],
    invoiceId: string,
  ): Promise<number>;
  detachFromInvoice(tx: Tx, invoiceId: string): Promise<void>;
}
export const ORDERS_PORT = Symbol('OrdersPort');
export class StubOrdersPort implements OrdersPort {
  async get(ids: string[]): Promise<OrderSummary[]> {
    return ids.includes(STUB_ORDER_ID) ? [fixtureOrderSummary] : [];
  }
  async lockOrder(tx: Tx, id: string): Promise<void> {
    void tx;
    void id;
  }
  async recordEvent(
    tx: Tx,
    orderId: string,
    type: OrderEventType,
    actorId: string | null,
    meta?: object,
  ): Promise<void> {
    void tx;
    void orderId;
    void type;
    void actorId;
    void meta;
  }
  async markDelivered(tx: Tx, orderIds: string[]): Promise<void> {
    void tx;
    void orderIds;
  }
  async attachToInvoice(
    tx: Tx,
    orderIds: string[],
    invoiceId: string,
  ): Promise<number> {
    void tx;
    void orderIds;
    void invoiceId;
    return 0;
  }
  async detachFromInvoice(tx: Tx, invoiceId: string): Promise<void> {
    void tx;
    void invoiceId;
  }
}
