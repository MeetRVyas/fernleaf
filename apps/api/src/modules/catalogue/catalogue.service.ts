import { Inject, Injectable } from '@nestjs/common';
import { CatalogueRepository } from './catalogue.repository.js';
import type { DishRecord, OptionRecord, GroupRecord, DishValues, OptionValues, GroupValues } from './catalogue.repository.js';
import { TxRunner } from '../../core/tx-runner.js';
import { ApiError } from '../../core/api-error.js';
import { REFERENCE_PORT, type ReferencePort } from '../reference/index.js';
import type { CataloguePort } from './ports.js';
import { hasDuplicateOptionIds, normalizeSku } from './domain/catalogue-rules.js';

function publicDish(row: DishRecord) {
  return { id: row.id, name: row.name, description: row.description, imageUrl: row.imageUrl, sku: row.sku, temperature: row.temperature, costCents: row.costCents, stationId: row.stationId, minOrderQty: row.minOrderQty, allergenIds: row.allergens.map(link => link.allergenId), dietaryTagIds: row.dietaryTags.map(link => link.tagId), isActive: row.isActive };
}
function publicOption(row: OptionRecord) {
  return { id: row.id, name: row.name, costCents: row.costCents, allergenIds: row.allergens.map(link => link.allergenId), dietaryTagIds: row.dietaryTags.map(link => link.tagId), isActive: row.isActive };
}
function publicGroup(row: GroupRecord) {
  return { id: row.id, dishId: row.dishId, name: row.name, isRequired: row.isRequired, sortOrder: row.sortOrder, options: row.options.map(link => ({ optionId: link.optionId, sortOrder: link.sortOrder })) };
}
type PageQuery = { page: number; pageSize: number; sort?: string; q?: string; active?: boolean };

@Injectable()
export class CatalogueService implements CataloguePort {
  constructor(
    @Inject(CatalogueRepository)
    private readonly repository: CatalogueRepository,
    @Inject(TxRunner) private readonly txRunner: TxRunner,
    @Inject(REFERENCE_PORT) private readonly reference: ReferencePort,
  ) {}

  async getDish(id: string) { const row = await this.repository.findDish(id); return row ? publicDish(row) : null; }
  async getOptions(ids: string[]) { return (await this.repository.getOptions(ids)).map(publicOption); }

  async dishDetail(id: string) {
    const row = await this.repository.findDish(id);
    if (!row) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
    return { ...publicDish(row), groups: (await this.repository.listGroups(id)).map(publicGroup) };
  }
  async listDishes(query: PageQuery) {
    const sort = query.sort ?? 'name:asc';
    const orderBy = this.dishSort(sort);
    const where = { ...(query.active === undefined ? {} : { isActive: query.active }), ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' as const } }, { sku: { contains: query.q, mode: 'insensitive' as const } }] } : {}) };
    const [rows, total] = await Promise.all([this.repository.listDishes((query.page - 1) * query.pageSize, query.pageSize, where, orderBy), this.repository.countDishes(where)]);
    return { items: rows.map(publicDish), total, page: query.page, pageSize: query.pageSize };
  }
  async createDish(values: DishValues) {
    const data = { ...values, name: values.name.trim(), sku: normalizeSku(values.sku) };
    await this.validateDish(data);
    return this.txRunner.run(async tx => {
      if (await this.repository.findDishBySku(data.sku, tx)) throw new ApiError('CONFLICT', 'SKU already exists', 409);
      try { return publicDish(await this.repository.createDish(tx, data)); }
      catch (error: unknown) { this.rethrowConstraint(error); throw error; }
    });
  }
  async updateDish(id: string, values: Partial<DishValues>) {
    const data = { ...values, ...(values.name === undefined ? {} : { name: values.name.trim() }), ...(values.sku === undefined ? {} : { sku: normalizeSku(values.sku) }) };
    await this.validateDish(data);
    return this.txRunner.run(async tx => {
      const current = await this.repository.findDish(id, tx);
      if (!current) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
      if (data.sku !== undefined && data.sku !== current.sku) {
        const existing = await this.repository.findDishBySku(data.sku, tx);
        if (existing) throw new ApiError('CONFLICT', 'SKU already exists', 409);
      }
      try { return publicDish(await this.repository.updateDish(tx, id, data)); }
      catch (error: unknown) { this.rethrowConstraint(error); throw error; }
    });
  }
  async listOptions(query: PageQuery) {
    const sort = query.sort ?? 'name:asc';
    const orderBy = this.optionSort(sort);
    const where = query.q ? { name: { contains: query.q, mode: 'insensitive' as const } } : {};
    const [rows, total] = await Promise.all([this.repository.listOptions((query.page - 1) * query.pageSize, query.pageSize, where, orderBy), this.repository.countOptions(where)]);
    return { items: rows.map(publicOption), total, page: query.page, pageSize: query.pageSize };
  }
  async createOption(values: OptionValues) {
    const data = { ...values, name: values.name.trim() };
    await this.validateOption(data);
    return this.txRunner.run(async tx => {
      try { return publicOption(await this.repository.createOption(tx, data)); }
      catch (error: unknown) { this.rethrowConstraint(error); throw error; }
    });
  }
  async updateOption(id: string, values: Partial<OptionValues>) {
    const data = { ...values, ...(values.name === undefined ? {} : { name: values.name.trim() }) };
    await this.validateOption(data);
    return this.txRunner.run(async tx => {
      if (!await this.repository.findOption(id, tx)) throw new ApiError('NOT_FOUND', 'Option not found', 404);
      try { return publicOption(await this.repository.updateOption(tx, id, data)); }
      catch (error: unknown) { this.rethrowConstraint(error); throw error; }
    });
  }
  async listGroups(dishId: string) {
    if (!await this.repository.findDish(dishId)) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
    return (await this.repository.listGroups(dishId)).map(publicGroup);
  }
  async createGroup(dishId: string, values: GroupValues) {
    this.validateGroup(values);
    return this.txRunner.run(async tx => {
      if (!await this.repository.findDish(dishId, tx)) throw new ApiError('NOT_FOUND', 'Dish not found', 404);
      await this.assertOptionsExist(tx, values.options);
      return publicGroup(await this.repository.createGroup(tx, dishId, { ...values, name: values.name.trim() }));
    });
  }
  async updateGroup(id: string, values: Partial<GroupValues>) {
    this.validateGroup(values);
    return this.txRunner.run(async tx => {
      if (!await this.repository.findGroup(id, tx)) throw new ApiError('NOT_FOUND', 'Group not found', 404);
      if (values.options) await this.assertOptionsExist(tx, values.options);
      return publicGroup(await this.repository.updateGroup(tx, id, { ...values, ...(values.name === undefined ? {} : { name: values.name.trim() }) }));
    });
  }
  async deleteGroup(id: string) {
    return this.txRunner.run(async tx => {
      if (!await this.repository.findGroup(id, tx)) throw new ApiError('NOT_FOUND', 'Group not found', 404);
      await this.repository.deleteGroup(tx, id);
      return { ok: true as const };
    });
  }

  private async assertOptionsExist(tx: Parameters<CatalogueRepository['existingOptionIds']>[0], options: GroupValues['options']) {
    const ids = options.map(option => option.optionId);
    const found = await this.repository.existingOptionIds(tx, ids);
    if (found.length !== ids.length) throw new ApiError('VALIDATION_ERROR', 'Unknown option', 422, { options: 'Every option must exist' });
  }
  private validateGroup(values: Partial<GroupValues>) {
    if (values.name !== undefined && !values.name.trim()) throw new ApiError('VALIDATION_ERROR', 'Group name is required', 422);
    if (values.options && hasDuplicateOptionIds(values.options)) throw new ApiError('VALIDATION_ERROR', 'Duplicate option in group', 422);
  }
  private async validateDish(values: Partial<DishValues>) {
    if (values.name !== undefined && !values.name) throw new ApiError('VALIDATION_ERROR', 'Dish name is required', 422);
    if (values.sku !== undefined && !values.sku) throw new ApiError('VALIDATION_ERROR', 'SKU is required', 422);
    if (values.minOrderQty !== undefined && values.minOrderQty < 1) throw new ApiError('VALIDATION_ERROR', 'Minimum quantity must be positive', 422);
    if (values.costCents !== undefined && values.costCents < 0) throw new ApiError('VALIDATION_ERROR', 'Cost cannot be negative', 422);
    await this.validateReferences(values.allergenIds, values.dietaryTagIds, values.stationId);
  }
  private async validateOption(values: Partial<OptionValues>) {
    if (values.name !== undefined && !values.name) throw new ApiError('VALIDATION_ERROR', 'Option name is required', 422);
    if (values.costCents !== undefined && values.costCents < 0) throw new ApiError('VALIDATION_ERROR', 'Cost cannot be negative', 422);
    await this.validateReferences(values.allergenIds, values.dietaryTagIds);
  }
  private async validateReferences(allergenIds?: string[], dietaryTagIds?: string[], stationId?: string | null) {
    if (allergenIds) {
      if (new Set(allergenIds).size !== allergenIds.length || (await this.reference.existingIds('allergen', allergenIds)).length !== allergenIds.length) throw new ApiError('VALIDATION_ERROR', 'Invalid allergens', 422, { allergenIds: 'Use unique existing allergens' });
    }
    if (dietaryTagIds) {
      if (new Set(dietaryTagIds).size !== dietaryTagIds.length || (await this.reference.existingIds('dietaryTag', dietaryTagIds)).length !== dietaryTagIds.length) throw new ApiError('VALIDATION_ERROR', 'Invalid dietary tags', 422, { dietaryTagIds: 'Use unique existing tags' });
    }
    if (stationId && (await this.reference.existingIds('kitchenStation', [stationId])).length !== 1) throw new ApiError('VALIDATION_ERROR', 'Invalid station', 422, { stationId: 'Station does not exist' });
  }
  private dishSort(sort: string) {
    if (sort === 'name:asc' || sort === 'name:desc') return { name: sort.endsWith('asc') ? 'asc' as const : 'desc' as const };
    if (sort === 'sku:asc' || sort === 'sku:desc') return { sku: sort.endsWith('asc') ? 'asc' as const : 'desc' as const };
    throw new ApiError('VALIDATION_ERROR', 'Unsupported sort', 422);
  }
  private optionSort(sort: string) {
    if (sort === 'name:asc' || sort === 'name:desc') return { name: sort.endsWith('asc') ? 'asc' as const : 'desc' as const };
    throw new ApiError('VALIDATION_ERROR', 'Unsupported sort', 422);
  }
  private rethrowConstraint(error: unknown): void {
    if (typeof error !== 'object' || error === null || !('code' in error)) return;
    if (error.code === 'P2002') throw new ApiError('CONFLICT', 'A unique value already exists', 409);
    if (error.code === 'P2003') throw new ApiError('VALIDATION_ERROR', 'A referenced item does not exist', 422);
  }
}
