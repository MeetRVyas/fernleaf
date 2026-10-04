import type { z } from 'zod';
import { employeeMenu, orderableDish } from '@fernleaf/shared';
export type EmployeeMenu = z.infer<typeof employeeMenu>;
export type OrderableDish = z.infer<typeof orderableDish>;
export const fixtureOrderableDish: OrderableDish = {
  id: '00000000-0000-4000-8000-000000000011',
  name: 'Fixture rice bowl',
  sku: 'fixture-bowl',
  priceCents: 215,
  minOrderQty: 1,
  groups: [],
};
export interface MenuPort {
  getMenuFor(employeeId: string): Promise<EmployeeMenu>;
  getOrderableDish(
    employeeId: string,
    dishId: string,
  ): Promise<OrderableDish | null>;
}
export const MENU_PORT = Symbol('MenuPort');
export class StubMenuPort implements MenuPort {
  async getMenuFor(employeeId: string): Promise<EmployeeMenu> {
    return {
      employeeId,
      categories: [
        {
          id: '00000000-0000-4000-8000-000000000041',
          name: 'Fixture menu',
          sortOrder: 0,
          isActive: true,
          isSecret: false,
          dishes: [fixtureOrderableDish],
        },
      ],
    };
  }
  async getOrderableDish(
    _employeeId: string,
    dishId: string,
  ): Promise<OrderableDish | null> {
    return dishId === fixtureOrderableDish.id ? fixtureOrderableDish : null;
  }
}
