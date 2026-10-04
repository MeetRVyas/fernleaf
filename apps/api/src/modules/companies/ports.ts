import type { z } from 'zod';
import { company, companyAddress, stringToDbDate } from '@fernleaf/shared';
export type Company = z.infer<typeof company>;
export type CompanyAddress = z.infer<typeof companyAddress>;
export const STUB_COMPANY_ID = '00000000-0000-4000-8000-000000000021';
export const STUB_ADDRESS_ID = '00000000-0000-4000-8000-000000000022';
export const fixtureAddress: CompanyAddress = {
  id: STUB_ADDRESS_ID,
  companyId: STUB_COMPANY_ID,
  label: 'Office',
  line1: '100 Main Street',
  line2: null,
  city: 'New York',
  region: 'NY',
  postalCode: '10001',
  country: 'US',
  isDefault: true,
};
export const fixtureCompany: Company = {
  id: STUB_COMPANY_ID,
  name: 'Fixture Company',
  tierId: null,
  defaultDeliveryTime: '12:00',
  deliveryLeadMinutes: 60,
  defaultPackaging: 'STANDARD',
  driverInstructions: '',
  defaultDriverId: null,
  billingName: 'Fixture Company',
  billingEmail: 'billing@fixture.test',
  billingPhone: '',
  billingAddress: '100 Main Street',
  ownerEmployeeId: null,
  workingDays: [1, 2, 3, 4, 5],
  domains: ['fixture.test'],
  addresses: [fixtureAddress],
  isActive: true,
};
export interface CompanyPort {
  get(id: string): Promise<Company | null>;
  getAddress(id: string): Promise<CompanyAddress | null>;
  allowsDelivery(companyId: string, date: string): Promise<boolean>;
}
export const COMPANY_PORT = Symbol('CompanyPort');
export class StubCompanyPort implements CompanyPort {
  async get(id: string): Promise<Company | null> {
    return id === STUB_COMPANY_ID ? fixtureCompany : null;
  }
  async getAddress(id: string): Promise<CompanyAddress | null> {
    return id === STUB_ADDRESS_ID ? fixtureAddress : null;
  }
  async allowsDelivery(companyId: string, date: string): Promise<boolean> {
    if (companyId !== STUB_COMPANY_ID) return false;
    const weekday = stringToDbDate(date).getUTCDay() || 7;
    return fixtureCompany.workingDays.includes(weekday);
  }
}
