import type { PrismaClient } from '../src/generated/prisma/client.js';

// Stable UUIDs make integration assertions independent of insertion order.
const fixtureId = (kind: number, number: number): string =>
  `${kind.toString().padStart(8, '0')}-0000-4000-8000-${number.toString().padStart(12, '0')}`;

export const fixtureIds = {
  company: [1, 2, 3].map(number => fixtureId(1, number)),
  employee: [1, 2, 3, 4, 5, 6].map(number => fixtureId(2, number)),
  dish: Array.from({ length: 12 }, (_, index) => fixtureId(3, index + 1)),
  tier: [1, 2, 3].map(number => fixtureId(4, number)),
  category: [1, 2, 3].map(number => fixtureId(5, number)),
  option: [1, 2].map(number => fixtureId(6, number)),
  group: fixtureId(7, 1),
  item: Array.from({ length: 12 }, (_, index) => fixtureId(8, index + 1)),
  address: [1, 2, 3].map(number => fixtureId(9, number)),
} as const;

/** Seed only domain fixtures. Staff account seeding stays in seed.ts. */
export async function seedTestFixtures(db: PrismaClient): Promise<typeof fixtureIds> {
  const [standard, costBased, partner] = fixtureIds.tier;
  await db.priceTier.upsert({ where: { id: standard }, update: {}, create: { id: standard, name: 'Fixture Standard', isDefault: true } });
  await db.priceTier.upsert({ where: { id: costBased }, update: {}, create: { id: costBased, name: 'Fixture Cost', derivationKind: 'COST_MULTIPLIER', factorMilli: 2400 } });
  await db.priceTier.upsert({ where: { id: partner }, update: {}, create: { id: partner, name: 'Fixture Partner', derivationKind: 'PERCENT_OVER_TIER', baseTierId: standard, percentBp: 1500 } });

  const companyNames = ['Alder Works', 'Birch Labs', 'Cedar Office'];
  for (let index = 0; index < 3; index++) {
    const companyId = fixtureIds.company[index];
    const domain = `fixture-${index + 1}.example`;
    await db.company.upsert({
      where: { id: companyId }, update: {},
      create: { id: companyId, name: companyNames[index], tierId: index === 1 ? costBased : null,
        billingName: companyNames[index], billingEmail: `billing@${domain}`, billingAddress: `${index + 1} Market Street` },
    });
    await db.companyDomain.upsert({ where: { domain }, update: {}, create: { id: fixtureId(10, index + 1), companyId, domain } });
    await db.companyAddress.upsert({ where: { id: fixtureIds.address[index] }, update: {}, create: {
      id: fixtureIds.address[index], companyId, label: 'Main', line1: `${index + 1} Market Street`,
      city: 'New York', region: 'NY', postalCode: '10001', country: 'US', isDefault: true,
    } });
  }

  for (let index = 0; index < 6; index++) {
    const companyIndex = Math.floor(index / 2);
    await db.employee.upsert({ where: { id: fixtureIds.employee[index] }, update: {}, create: {
      id: fixtureIds.employee[index], companyId: fixtureIds.company[companyIndex],
      name: `Fixture Employee ${index + 1}`, email: `employee${index + 1}@fixture-${companyIndex + 1}.example`,
    } });
  }
  for (let index = 0; index < 3; index++) {
    await db.company.update({ where: { id: fixtureIds.company[index] }, data: { ownerEmployeeId: fixtureIds.employee[index * 2] } });
  }

  const stationId = fixtureId(11, 1);
  await db.kitchenStation.upsert({ where: { id: stationId }, update: {}, create: { id: stationId, name: 'Fixture Hot Line' } });
  for (let index = 0; index < 12; index++) {
    const dishId = fixtureIds.dish[index];
    await db.dish.upsert({ where: { id: dishId }, update: {}, create: {
      id: dishId, name: `Fixture Dish ${index + 1}`, sku: `fixture-dish-${index + 1}`,
      temperature: index % 2 === 0 ? 'HOT' : 'COLD', costCents: 100 + index * 10,
      stationId: index % 2 === 0 ? stationId : null,
    } });
    await db.priceEntry.upsert({ where: { tierId_subjectType_subjectId: { tierId: standard, subjectType: 'DISH', subjectId: dishId } }, update: {}, create: {
      id: fixtureId(12, index + 1), tierId: standard, subjectType: 'DISH', subjectId: dishId, priceCents: 300 + index * 25,
    } });
  }

  for (let index = 0; index < 2; index++) {
    await db.option.upsert({ where: { id: fixtureIds.option[index] }, update: {}, create: {
      id: fixtureIds.option[index], name: index === 0 ? 'Tofu' : 'Paneer', costCents: 25 + index * 10,
    } });
    await db.priceEntry.upsert({ where: { tierId_subjectType_subjectId: { tierId: standard, subjectType: 'OPTION', subjectId: fixtureIds.option[index] } }, update: {}, create: {
      id: fixtureId(13, index + 1), tierId: standard, subjectType: 'OPTION', subjectId: fixtureIds.option[index], priceCents: index * 50,
    } });
  }
  await db.optionGroup.upsert({ where: { id: fixtureIds.group }, update: {}, create: {
    id: fixtureIds.group, dishId: fixtureIds.dish[0], name: 'Protein', isRequired: true,
  } });
  for (let index = 0; index < 2; index++) {
    await db.optionGroupOption.upsert({ where: { groupId_optionId: { groupId: fixtureIds.group, optionId: fixtureIds.option[index] } }, update: {}, create: {
      id: fixtureId(14, index + 1), groupId: fixtureIds.group, optionId: fixtureIds.option[index], sortOrder: index,
    } });
  }

  const categoryNames = ['Bowls', 'Sides', 'Private Menu'];
  for (let index = 0; index < 3; index++) {
    await db.menuCategory.upsert({ where: { id: fixtureIds.category[index] }, update: {}, create: {
      id: fixtureIds.category[index], name: categoryNames[index], sortOrder: index, isSecret: index === 2,
    } });
  }
  for (let index = 0; index < 12; index++) {
    await db.menuItem.upsert({ where: { id: fixtureIds.item[index] }, update: {}, create: {
      id: fixtureIds.item[index], categoryId: fixtureIds.category[Math.floor(index / 4)],
      dishId: fixtureIds.dish[index], sortOrder: index % 4,
    } });
  }
  await db.companyHiddenItem.upsert({ where: { companyId_itemId: { companyId: fixtureIds.company[0], itemId: fixtureIds.item[1] } }, update: {}, create: {
    companyId: fixtureIds.company[0], itemId: fixtureIds.item[1],
  } });
  return fixtureIds;
}
