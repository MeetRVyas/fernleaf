import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { Module, type INestApplicationContext } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import { CoreModule } from '../../core/core.module.js';
import { STUB_DISH_ID } from '../catalogue/index.js';
import { STUB_COMPANY_ID } from '../companies/index.js';
import { STUB_EMPLOYEE_ID } from '../employees/index.js';
import { MenuService } from './menu.service.js';
import { MenuModule } from './menu.module.js';

@Module({ imports: [CoreModule, MenuModule] })
class TestModule {}
let app: INestApplicationContext;
let db: PrismaService;
let menu: MenuService;
beforeAll(async () => {
  app = await NestFactory.createApplicationContext(TestModule, {
    logger: false,
  });
  db = app.get(PrismaService);
  menu = app.get(MenuService);
  await db.company.create({
    data: {
      id: STUB_COMPANY_ID,
      name: 'Menu test company',
      billingName: 'Menu test company',
      billingEmail: 'billing@fixture.test',
      billingAddress: 'Test address',
    },
  });
  await db.dish.create({
    data: {
      id: STUB_DISH_ID,
      name: 'Fixture rice bowl',
      sku: 'fixture-bowl',
      temperature: 'HOT',
      costCents: 88,
    },
  });
  const tier = await db.priceTier.create({
    data: { name: 'Menu test default', isDefault: true },
  });
  await db.priceEntry.create({
    data: {
      tierId: tier.id,
      subjectType: 'DISH',
      subjectId: STUB_DISH_ID,
      priceCents: 215,
    },
  });
});
afterAll(async () => {
  await app?.close();
});

describe('menu database', () => {
  it('uses the same priced dish for preview and order validation, then hides it', async () => {
    const category = await menu.createCategory({
      name: 'Bowls',
      sortOrder: 1,
      isActive: true,
      isSecret: false,
    });
    const item = await menu.createItem({
      categoryId: category.id,
      dishId: STUB_DISH_ID,
      sortOrder: 1,
      isActive: true,
    });
    const preview = await menu.getMenuFor(STUB_EMPLOYEE_ID);
    expect(preview.categories[0]?.dishes[0]?.id).toBe(STUB_DISH_ID);
    expect(await menu.getOrderableDish(STUB_EMPLOYEE_ID, STUB_DISH_ID)).toEqual(
      preview.categories[0]?.dishes[0],
    );
    await menu.setHiding(STUB_COMPANY_ID, [], [item.id]);
    expect((await menu.getMenuFor(STUB_EMPLOYEE_ID)).categories).toEqual([]);
    expect(
      await menu.getOrderableDish(STUB_EMPLOYEE_ID, STUB_DISH_ID),
    ).toBeNull();
  });
  it('opens an active secret category by id while omitting it from listing', async () => {
    const category = await menu.createCategory({
      name: 'Private',
      sortOrder: 2,
      isActive: true,
      isSecret: true,
    });
    await menu.createItem({
      categoryId: category.id,
      dishId: STUB_DISH_ID,
      sortOrder: 1,
      isActive: true,
    });
    expect((await menu.getMenuFor(STUB_EMPLOYEE_ID)).categories).toEqual([]);
    expect(
      (await menu.previewCategory(STUB_EMPLOYEE_ID, category.id)).dishes[0]?.id,
    ).toBe(STUB_DISH_ID);
  });
});
