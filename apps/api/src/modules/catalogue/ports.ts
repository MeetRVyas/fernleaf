import type { z } from 'zod';
import { dish, option } from '@fernleaf/shared';
export type Dish = z.infer<typeof dish>;
export type Option = z.infer<typeof option>;
export const STUB_DISH_ID = '00000000-0000-4000-8000-000000000011';
export const STUB_OPTION_ID = '00000000-0000-4000-8000-000000000012';
export const fixtureDish: Dish = {
  id: STUB_DISH_ID,
  name: 'Fixture rice bowl',
  description: 'Deterministic port fixture',
  imageUrl: null,
  sku: 'fixture-bowl',
  temperature: 'HOT',
  costCents: 88,
  stationId: null,
  minOrderQty: 1,
  allergenIds: [],
  dietaryTagIds: [],
  isActive: true,
};
export const fixtureOption: Option = {
  id: STUB_OPTION_ID,
  name: 'Fixture tofu',
  costCents: 25,
  allergenIds: [],
  dietaryTagIds: [],
  isActive: true,
};
export interface CataloguePort {
  getDish(id: string): Promise<Dish | null>;
  getOptions(ids: string[]): Promise<Option[]>;
}
export const CATALOGUE_PORT = Symbol('CataloguePort');
export class StubCataloguePort implements CataloguePort {
  async getDish(id: string): Promise<Dish | null> {
    return id === STUB_DISH_ID ? fixtureDish : null;
  }
  async getOptions(ids: string[]): Promise<Option[]> {
    return ids.includes(STUB_OPTION_ID) ? [fixtureOption] : [];
  }
}
