import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';
@Injectable()
export class MenuRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  categories() { return this.db.menuCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }); }
  category(id: string) { return this.db.menuCategory.findUnique({ where: { id } }); }
  createCategory(tx: Tx, data: { name: string; sortOrder: number; isActive: boolean; isSecret: boolean }) { return tx.menuCategory.create({ data }); }
  updateCategory(tx: Tx, id: string, data: Partial<{ name: string; sortOrder: number; isActive: boolean; isSecret: boolean }>) { return tx.menuCategory.update({ where: { id }, data }); }
  item(id: string) { return this.db.menuItem.findUnique({ where: { id } }); }
  items(categoryId?: string) { return this.db.menuItem.findMany({ where: categoryId ? { categoryId } : {}, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }); }
  createItem(tx: Tx, data: { categoryId: string; dishId: string; sortOrder: number; isActive: boolean }) { return tx.menuItem.create({ data }); }
  updateItem(tx: Tx, id: string, data: Partial<{ categoryId: string; dishId: string; sortOrder: number; isActive: boolean }>) { return tx.menuItem.update({ where: { id }, data }); }
  hiddenCategories(companyId: string) { return this.db.companyHiddenCategory.findMany({ where: { companyId } }); }
  hiddenItems(companyId: string) { return this.db.companyHiddenItem.findMany({ where: { companyId } }); }
  async setHiding(tx: Tx, companyId: string, categoryIds: string[], itemIds: string[]) {
    await tx.companyHiddenCategory.deleteMany({ where: { companyId } });
    await tx.companyHiddenItem.deleteMany({ where: { companyId } });
    if (categoryIds.length) await tx.companyHiddenCategory.createMany({ data: categoryIds.map(categoryId => ({ companyId, categoryId })) });
    if (itemIds.length) await tx.companyHiddenItem.createMany({ data: itemIds.map(itemId => ({ companyId, itemId })) });
  }
}
