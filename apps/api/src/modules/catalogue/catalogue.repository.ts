import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';
import type { Prisma } from '../../generated/prisma/client.js';

export const dishInclude = { allergens: true, dietaryTags: true } as const;
export const optionInclude = { allergens: true, dietaryTags: true } as const;
export const groupInclude = { options: { orderBy: { sortOrder: 'asc' as const } } } as const;
export type DishRecord = Prisma.DishGetPayload<{ include: typeof dishInclude }>;
export type OptionRecord = Prisma.OptionGetPayload<{ include: typeof optionInclude }>;
export type GroupRecord = Prisma.OptionGroupGetPayload<{ include: typeof groupInclude }>;

export type DishValues = { name: string; description: string; imageUrl: string | null; sku: string; temperature: 'HOT' | 'COLD'; costCents: number; stationId: string | null; minOrderQty: number; allergenIds: string[]; dietaryTagIds: string[]; isActive: boolean };
export type OptionValues = { name: string; costCents: number; allergenIds: string[]; dietaryTagIds: string[]; isActive: boolean };
export type GroupValues = { name: string; isRequired: boolean; sortOrder: number; options: { optionId: string; sortOrder: number }[] };
@Injectable()
export class CatalogueRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  listDishes(skip: number, take: number, where: Prisma.DishWhereInput, orderBy: Prisma.DishOrderByWithRelationInput) {
    return this.db.dish.findMany({ where, skip, take, orderBy, include: dishInclude });
  }
  countDishes(where: Prisma.DishWhereInput) { return this.db.dish.count({ where }); }
  findDish(id: string, tx?: Tx) { return (tx ?? this.db).dish.findUnique({ where: { id }, include: dishInclude }); }
  findDishBySku(sku: string, tx?: Tx) { return (tx ?? this.db).dish.findUnique({ where: { sku } }); }
  listGroups(dishId: string) { return this.db.optionGroup.findMany({ where: { dishId }, orderBy: { sortOrder: 'asc' }, include: groupInclude }); }
  findGroup(id: string, tx?: Tx) { return (tx ?? this.db).optionGroup.findUnique({ where: { id }, include: groupInclude }); }
  createDish(tx: Tx, values: DishValues) {
    const { allergenIds, dietaryTagIds, ...data } = values;
    return tx.dish.create({ data: { ...data, allergens: { create: allergenIds.map(allergenId => ({ allergenId })) }, dietaryTags: { create: dietaryTagIds.map(tagId => ({ tagId })) } }, include: dishInclude });
  }
  async updateDish(tx: Tx, id: string, values: Partial<DishValues>) {
    const { allergenIds, dietaryTagIds, ...data } = values;
    if (allergenIds !== undefined) {
      await tx.dishAllergen.deleteMany({ where: { dishId: id } });
      await tx.dishAllergen.createMany({ data: allergenIds.map(allergenId => ({ dishId: id, allergenId })) });
    }
    if (dietaryTagIds !== undefined) {
      await tx.dishDietaryTag.deleteMany({ where: { dishId: id } });
      await tx.dishDietaryTag.createMany({ data: dietaryTagIds.map(tagId => ({ dishId: id, tagId })) });
    }
    return tx.dish.update({ where: { id }, data, include: dishInclude });
  }
  listOptions(skip: number, take: number, where: Prisma.OptionWhereInput, orderBy: Prisma.OptionOrderByWithRelationInput) {
    return this.db.option.findMany({ where, skip, take, orderBy, include: optionInclude });
  }
  countOptions(where: Prisma.OptionWhereInput) { return this.db.option.count({ where }); }
  findOption(id: string, tx?: Tx) { return (tx ?? this.db).option.findUnique({ where: { id }, include: optionInclude }); }
  getOptions(ids: string[]) { return this.db.option.findMany({ where: { id: { in: ids } }, include: optionInclude }); }
  createOption(tx: Tx, values: OptionValues) {
    const { allergenIds, dietaryTagIds, ...data } = values;
    return tx.option.create({ data: { ...data, allergens: { create: allergenIds.map(allergenId => ({ allergenId })) }, dietaryTags: { create: dietaryTagIds.map(tagId => ({ tagId })) } }, include: optionInclude });
  }
  async updateOption(tx: Tx, id: string, values: Partial<OptionValues>) {
    const { allergenIds, dietaryTagIds, ...data } = values;
    if (allergenIds !== undefined) {
      await tx.optionAllergen.deleteMany({ where: { optionId: id } });
      await tx.optionAllergen.createMany({ data: allergenIds.map(allergenId => ({ optionId: id, allergenId })) });
    }
    if (dietaryTagIds !== undefined) {
      await tx.optionDietaryTag.deleteMany({ where: { optionId: id } });
      await tx.optionDietaryTag.createMany({ data: dietaryTagIds.map(tagId => ({ optionId: id, tagId })) });
    }
    return tx.option.update({ where: { id }, data, include: optionInclude });
  }
  existingOptionIds(tx: Tx, ids: string[]) { return tx.option.findMany({ where: { id: { in: ids } }, select: { id: true } }); }
  createGroup(tx: Tx, dishId: string, values: GroupValues) { return tx.optionGroup.create({ data: { dishId, name: values.name, isRequired: values.isRequired, sortOrder: values.sortOrder, options: { create: values.options } }, include: groupInclude }); }
  async updateGroup(tx: Tx, id: string, values: Partial<GroupValues>) {
    if (values.options !== undefined) {
      await tx.optionGroupOption.deleteMany({ where: { groupId: id } });
      await tx.optionGroupOption.createMany({ data: values.options.map(option => ({ groupId: id, ...option })) });
    }
    return tx.optionGroup.update({ where: { id }, data: { name: values.name, isRequired: values.isRequired, sortOrder: values.sortOrder }, include: groupInclude });
  }
  async deleteGroup(tx: Tx, id: string) {
    await tx.optionGroupOption.deleteMany({ where: { groupId: id } });
    await tx.optionGroup.delete({ where: { id } });
  }
}
