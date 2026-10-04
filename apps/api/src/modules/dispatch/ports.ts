import type { z } from 'zod';
import { drop } from '@fernleaf/shared';
export type Drop = z.infer<typeof drop>;
export const STUB_DROP_ID = '00000000-0000-4000-8000-000000000071';
export const fixtureDrop: Drop = {
  id: STUB_DROP_ID,
  deliveryDate: '2026-10-07',
  companyId: '00000000-0000-4000-8000-000000000021',
  addressId: '00000000-0000-4000-8000-000000000022',
  deliveryTime: '12:00',
  driverId: null,
  deliveredAt: null,
  note: null,
  onTime: null,
  orderIds: ['00000000-0000-4000-8000-000000000051'],
  stage: 'KITCHEN',
};
export interface DispatchPort {
  getDrop(id: string): Promise<Drop | null>;
  getDropsForOrder(orderId: string): Promise<Drop[]>;
}
export const DISPATCH_PORT = Symbol('DispatchPort');
export class StubDispatchPort implements DispatchPort {
  async getDrop(id: string): Promise<Drop | null> {
    return id === STUB_DROP_ID ? fixtureDrop : null;
  }
  async getDropsForOrder(orderId: string): Promise<Drop[]> {
    return fixtureDrop.orderIds.includes(orderId) ? [fixtureDrop] : [];
  }
}
