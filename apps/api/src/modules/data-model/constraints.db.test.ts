import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { fixtureIds, seedTestFixtures } from '../../../prisma/test-fixtures.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for database tests');
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

beforeAll(async () => { await seedTestFixtures(db); });
afterAll(async () => { await db.$disconnect(); await pool.end(); });

async function expectDatabaseError(sql: string, parameters: unknown[], code: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('BEGIN');
    await expect(client.query(sql, parameters)).rejects.toMatchObject({ code });
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}

describe('domain migration constraints', () => {
  it('provides the documented deterministic fixture shape', async () => {
    expect(await db.company.count()).toBe(3);
    expect(await db.employee.count()).toBe(6);
    expect(await db.dish.count()).toBe(12);
    expect(await db.priceTier.count()).toBe(3);
    expect(await db.menuCategory.count({ where: { isSecret: true } })).toBe(1);
    expect(await db.companyHiddenItem.count()).toBe(1);
  });

  it('allows only one default price tier', async () => {
    await expectDatabaseError(
      'INSERT INTO price_tiers (id, name, is_default, updated_at) VALUES ($1, $2, true, now())',
      ['00000020-0000-4000-8000-000000000001', 'Another Default'], '23505',
    );
  });

  it('allows only one default address per company', async () => {
    await expectDatabaseError(
      `INSERT INTO company_addresses (id, company_id, label, line1, city, region, postal_code, country, is_default, updated_at)
       VALUES ($1, $2, 'Second', '2 Main', 'New York', 'NY', '10001', 'US', true, now())`,
      ['00000020-0000-4000-8000-000000000002', fixtureIds.company[0]], '23505',
    );
  });

  it.each([
    ['employee email', `INSERT INTO employees (id, company_id, name, email, updated_at) VALUES ($1, $2, 'Upper', 'Upper@fixture-1.example', now())`, '00000020-0000-4000-8000-000000000003', fixtureIds.company[0]],
    ['company domain', `INSERT INTO company_domains (id, company_id, domain, updated_at) VALUES ($1, $2, 'Upper.example', now())`, '00000020-0000-4000-8000-000000000004', fixtureIds.company[0]],
    ['dish SKU', `INSERT INTO dishes (id, name, sku, temperature, cost_cents, updated_at) VALUES ($1, 'Upper', 'UPPER-SKU', 'HOT', 100, now())`, '00000020-0000-4000-8000-000000000005', null],
  ])('rejects uppercase %s', async (_label, sql, id, companyId) => {
    await expectDatabaseError(sql, companyId ? [id, companyId] : [id], '23514');
  });

  it('rejects non-positive line and combo quantities', async () => {
    await expectDatabaseError('UPDATE dishes SET min_order_qty = 0 WHERE id = $1', [fixtureIds.dish[0]], '23514');
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query('BEGIN');
      const staffId = '00000020-0000-4000-8000-000000000006';
      const orderId = '00000020-0000-4000-8000-000000000007';
      const lineId = '00000020-0000-4000-8000-000000000008';
      await client.query(`INSERT INTO staff_users (id, name, email, password_hash, role, updated_at) VALUES ($1, 'Fixture Actor', 'fixture-actor@example.com', 'hash', 'ADMIN', now())`, [staffId]);
      await client.query(`INSERT INTO orders (id, employee_id, company_id, delivery_date, delivery_time, created_by_staff_id, updated_at)
        VALUES ($1, $2, $3, DATE '2026-10-20', '12:00', $4, now())`, [orderId, fixtureIds.employee[0], fixtureIds.company[0], staffId]);
      await client.query('SAVEPOINT before_line');
      await expect(client.query(`INSERT INTO order_lines (id, order_id, dish_id, dish_snapshot, quantity, line_total_cents, updated_at)
        VALUES ($1, $2, $3, '{}'::jsonb, 0, 0, now())`, [lineId, orderId, fixtureIds.dish[0]])).rejects.toMatchObject({ code: '23514' });
      await client.query('ROLLBACK TO SAVEPOINT before_line');
      await client.query(`INSERT INTO order_lines (id, order_id, dish_id, dish_snapshot, quantity, line_total_cents, updated_at)
        VALUES ($1, $2, $3, '{}'::jsonb, 1, 100, now())`, [lineId, orderId, fixtureIds.dish[0]]);
      await expect(client.query(`INSERT INTO order_line_combos
        (id, order_line_id, quantity, dish_price_cents, unit_price_cents, options_snapshot, combo_key, updated_at)
        VALUES ($1, $2, 0, 100, 100, '[]'::jsonb, 'empty', now())`,
        ['00000020-0000-4000-8000-000000000010', lineId])).rejects.toMatchObject({ code: '23514' });
      await client.query('ROLLBACK');
    } finally { await client.end(); }
  });

  it('rejects negative cents and zero dish prices', async () => {
    await expectDatabaseError('UPDATE dishes SET cost_cents = -1 WHERE id = $1', [fixtureIds.dish[0]], '23514');
    await expectDatabaseError(`INSERT INTO price_entries (id, tier_id, subject_type, subject_id, price_cents, updated_at)
      VALUES ($1, $2, 'DISH', $3, 0, now())`,
      ['00000020-0000-4000-8000-000000000009', fixtureIds.tier[1], fixtureIds.dish[0]], '23514');
    await expectDatabaseError('UPDATE price_entries SET price_cents = -1 WHERE subject_type = $1 AND subject_id = $2',
      ['OPTION', fixtureIds.option[0]], '23514');
  });
});
