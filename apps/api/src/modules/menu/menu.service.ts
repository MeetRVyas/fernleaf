import { Inject, Injectable } from '@nestjs/common';
import { MenuRepository } from './menu.repository.js';
import { ApiError } from '../../core/api-error.js';
import { TxRunner } from '../../core/tx-runner.js';
import { CATALOGUE_PORT, type CataloguePort } from '../catalogue/index.js';
import { PRICING_PORT, type PricingPort } from '../pricing/index.js';
import { COMPANY_PORT, type CompanyPort } from '../companies/index.js';
import { EMPLOYEE_PORT, type EmployeePort } from '../employees/index.js';
import { visibleCategory, visibleDish } from './domain/visibility.js';
import type { MenuPort, EmployeeMenu, OrderableDish } from './ports.js';
import type { z } from 'zod';
import type { menuCategory, menuItem } from '@fernleaf/shared';
type CategoryBody = Omit<z.infer<typeof menuCategory>, 'id'>;
type ItemBody = Omit<z.infer<typeof menuItem>, 'id'>;
@Injectable()
export class MenuService implements MenuPort {
  constructor(
    @Inject(MenuRepository) private readonly repository: MenuRepository,
    @Inject(TxRunner) private readonly txRunner: TxRunner,
    @Inject(CATALOGUE_PORT) private readonly catalogue: CataloguePort,
    @Inject(PRICING_PORT) private readonly pricing: PricingPort,
    @Inject(COMPANY_PORT) private readonly companies: CompanyPort,
    @Inject(EMPLOYEE_PORT) private readonly employees: EmployeePort,
  ) {}
  listCategories() { return this.repository.categories(); }
  createCategory(body: CategoryBody) { return this.txRunner.run(tx => this.repository.createCategory(tx, body)); }
  async updateCategory(id: string, body: Partial<CategoryBody>) {
    if (!await this.repository.category(id)) throw new ApiError('NOT_FOUND', 'Category not found', 404);
    return this.txRunner.run(tx => this.repository.updateCategory(tx, id, body));
  }
  async createItem(body: ItemBody) {
    if (!await this.repository.category(body.categoryId)) throw new ApiError('NOT_FOUND', 'Category not found', 404);
    if (!await this.catalogue.getDish(body.dishId)) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
    if ((await this.repository.items(body.categoryId)).some(item => item.dishId === body.dishId)) throw new ApiError('CONFLICT', 'Dish is already in category', 409);
    return this.txRunner.run(tx => this.repository.createItem(tx, body));
  }
  async updateItem(id: string, patch: Partial<ItemBody>) {
    const old = await this.repository.item(id);
    if (!old) throw new ApiError('NOT_FOUND', 'Menu item not found', 404);
    if (patch.categoryId && !await this.repository.category(patch.categoryId)) throw new ApiError('NOT_FOUND', 'Category not found', 404);
    if (patch.dishId && !await this.catalogue.getDish(patch.dishId)) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
    const categoryId = patch.categoryId ?? old.categoryId, dishId = patch.dishId ?? old.dishId;
    if ((await this.repository.items(categoryId)).some(item => item.id !== id && item.dishId === dishId)) throw new ApiError('CONFLICT', 'Dish is already in category', 409);
    return this.txRunner.run(tx => this.repository.updateItem(tx, id, patch));
  }
  async setHiding(companyId: string, hiddenCategoryIds: string[], hiddenItemIds: string[]) {
    if (!await this.companies.get(companyId)) throw new ApiError('NOT_FOUND', 'Company not found', 404);
    const categoryIds = [...new Set(hiddenCategoryIds)], itemIds = [...new Set(hiddenItemIds)];
    for (const id of categoryIds) if (!await this.repository.category(id)) throw new ApiError('NOT_FOUND', 'Category not found', 404);
    for (const id of itemIds) if (!await this.repository.item(id)) throw new ApiError('NOT_FOUND', 'Menu item not found', 404);
    await this.txRunner.run(tx => this.repository.setHiding(tx, companyId, categoryIds, itemIds));
    return { hiddenCategoryIds: categoryIds, hiddenItemIds: itemIds };
  }
  private async context(employeeId: string) {
    const employee = await this.employees.get(employeeId);
    if (!employee || !employee.isActive) throw new ApiError('NOT_FOUND', 'Employee not found', 404);
    const company = await this.companies.get(employee.companyId);
    if (!company || !company.isActive) throw new ApiError('NOT_FOUND', 'Company not found', 404);
    const tierId = await this.pricing.effectiveTierId(company.id);
    const hiddenCategories = new Set((await this.repository.hiddenCategories(company.id)).map(row => row.categoryId));
    const hiddenItems = new Set((await this.repository.hiddenItems(company.id)).map(row => row.itemId));
    return { tierId, hiddenCategories, hiddenItems };
  }
  private async categoryDishes(categoryId: string, tierId: string, hiddenItems: ReadonlySet<string>): Promise<OrderableDish[]> {
    const items = (await this.repository.items(categoryId)).filter(item => item.isActive && !hiddenItems.has(item.id));
    const dishes = await Promise.all(items.map(item => this.catalogue.getDish(item.dishId)));
    const priced = dishes.filter(dish => dish?.isActive).map(dish => ({ type: 'DISH' as const, id: dish!.id, costCents: dish!.costCents }));
    const prices = await this.pricing.resolve(tierId, priced);
    return dishes.flatMap(dish => {
      if (!dish) return [];
      const priceCents = prices.get(`DISH:${dish.id}`) ?? null;
      // Group availability awaits a CataloguePort group lookup. Until then only the shell's group-free fixture is supported.
      if (!visibleDish(dish.isActive, false, priceCents, [])) return [];
      return [{ id: dish.id, name: dish.name, sku: dish.sku, priceCents: priceCents!, minOrderQty: dish.minOrderQty, groups: [] }];
    });
  }
  async getMenuFor(employeeId: string): Promise<EmployeeMenu> {
    const { tierId, hiddenCategories, hiddenItems } = await this.context(employeeId);
    const categories = await this.repository.categories();
    const visible = categories.filter(category => visibleCategory(category.isActive, category.isSecret, hiddenCategories.has(category.id), false));
    const withDishes = await Promise.all(visible.map(async category => ({ ...category, dishes: await this.categoryDishes(category.id, tierId, hiddenItems) })));
    return { employeeId, categories: withDishes.filter(category => category.dishes.length > 0) };
  }
  async previewCategory(employeeId: string, categoryId: string) {
    const { tierId, hiddenCategories, hiddenItems } = await this.context(employeeId);
    const category = await this.repository.category(categoryId);
    if (!category || !visibleCategory(category.isActive, category.isSecret, hiddenCategories.has(category.id), true)) throw new ApiError('NOT_FOUND', 'Category not found', 404);
    return { ...category, dishes: await this.categoryDishes(category.id, tierId, hiddenItems) };
  }
  async getOrderableDish(employeeId: string, dishId: string): Promise<OrderableDish | null> {
    const menu = await this.getMenuFor(employeeId);
    for (const category of menu.categories) {
      const dish = category.dishes.find(item => item.id === dishId);
      if (dish) return dish;
    }
    const categories = await this.repository.categories();
    for (const category of categories.filter(item => item.isSecret)) {
      try { const opened = await this.previewCategory(employeeId, category.id); const dish = opened.dishes.find(item => item.id === dishId); if (dish) return dish; }
      catch (error) { if (!(error instanceof ApiError) || error.code !== 'NOT_FOUND') throw error; }
    }
    return null;
  }
}
