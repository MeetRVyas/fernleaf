import type { z } from 'zod';
import { prepUnit } from '@fernleaf/shared';
export type PrepUnit = z.infer<typeof prepUnit>;
export const fixturePrepUnit: PrepUnit = {
  id: '00000000-0000-4000-8000-000000000061',
  comboId: '00000000-0000-4000-8000-000000000062',
  orderId: '00000000-0000-4000-8000-000000000051',
  stationId: null,
  dishName: 'Fixture rice bowl',
  quantity: 1,
  startedAt: null,
  doneAt: null,
  plannedReadyAt: '2026-10-07T14:30:00Z',
  urgency: 'ON_TIME',
};
export interface KitchenPort {
  getReadyAt(orderId: string): Promise<Date | null>;
  getUnits(orderId: string): Promise<PrepUnit[]>;
}
export const KITCHEN_PORT = Symbol('KitchenPort');
export class StubKitchenPort implements KitchenPort {
  async getReadyAt(orderId: string): Promise<Date | null> {
    void orderId;
    return null;
  }
  async getUnits(orderId: string): Promise<PrepUnit[]> {
    return orderId === fixturePrepUnit.orderId ? [fixturePrepUnit] : [];
  }
}
