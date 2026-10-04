import type { z } from 'zod';
import { employee } from '@fernleaf/shared';
export type Employee = z.infer<typeof employee>;
export const STUB_EMPLOYEE_ID = '00000000-0000-4000-8000-000000000031';
export const fixtureEmployee: Employee = {
  id: STUB_EMPLOYEE_ID,
  companyId: '00000000-0000-4000-8000-000000000021',
  name: 'Fixture Employee',
  email: 'employee@fixture.test',
  phone: null,
  canChooseAddress: false,
  canChangeDeliveryTime: false,
  canChangePackaging: false,
  allergenIds: [],
  dietaryTagIds: [],
  isActive: true,
};
export interface EmployeePort {
  get(id: string): Promise<Employee | null>;
}
export const EMPLOYEE_PORT = Symbol('EmployeePort');
export class StubEmployeePort implements EmployeePort {
  async get(id: string): Promise<Employee | null> {
    return id === STUB_EMPLOYEE_ID ? fixtureEmployee : null;
  }
}
