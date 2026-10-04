import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { fixtureIds, seedTestFixtures } from '../../../prisma/test-fixtures.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for database tests');
const pool = new Pool({ connectionString: databaseUrl, max: 5 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

beforeAll(async () => { await seedTestFixtures(db); });
afterAll(async () => { await db.$disconnect(); await pool.end(); });

type ConstraintCase = { name: string; table: string; invalid: string };
const cases: ConstraintCase[] = [
  { name: 'prep_units_done_requires_start', table: 'prep_units', invalid: 'started_at = NULL, started_by_id = NULL' },
  { name: 'prep_units_start_actor_matches_time', table: 'prep_units', invalid: "started_at = '2026-10-20 09:00Z', started_by_id = NULL" },
  { name: 'prep_units_done_actor_matches_time', table: 'prep_units', invalid: "done_at = '2026-10-20 10:00Z', done_by_id = NULL" },
  { name: 'prep_units_done_after_start', table: 'prep_units', invalid: "done_at = '2026-10-20 08:00Z'" },
  { name: 'order_kitchen_state_ready_requires_start', table: 'order_kitchen_state', invalid: "started_at = NULL, ready_at = '2026-10-20 10:00Z'" },
  { name: 'order_kitchen_state_ready_after_start', table: 'order_kitchen_state', invalid: "ready_at = '2026-10-20 08:00Z'" },
  { name: 'order_dispatch_state_out_requires_ready', table: 'order_dispatch_state', invalid: "dispatch_ready_at = NULL, out_for_delivery_at = '2026-10-20 11:00Z'" },
  { name: 'order_dispatch_state_delivered_requires_out', table: 'order_dispatch_state', invalid: "out_for_delivery_at = NULL, delivered_at = '2026-10-20 12:00Z'" },
  { name: 'order_dispatch_state_out_after_ready', table: 'order_dispatch_state', invalid: "out_for_delivery_at = '2026-10-20 09:00Z'" },
  { name: 'order_dispatch_state_delivered_after_out', table: 'order_dispatch_state', invalid: "delivered_at = '2026-10-20 10:00Z'" },
  { name: 'drops_delivered_actor_matches_time', table: 'drops', invalid: 'delivered_by_id = NULL' },
  { name: 'drops_on_time_matches_delivery', table: 'drops', invalid: 'on_time = NULL' },
  { name: 'orders_invoice_billable_status', table: 'orders', invalid: "status = 'DRAFT'" },
  { name: 'orders_confirmed_has_time', table: 'orders', invalid: 'confirmed_at = NULL' },
  { name: 'orders_placed_has_time', table: 'orders', invalid: 'placed_at = NULL' },
  { name: 'orders_cancelled_has_time', table: 'orders', invalid: "status = 'CANCELLED', cancelled_at = NULL" },
  { name: 'orders_rejected_has_time_and_reason', table: 'orders', invalid: "status = 'REJECTED', invoice_id = NULL, rejected_at = NULL, reason = '   '" },
  { name: 'orders_rejected_has_time_and_reason', table: 'orders', invalid: "status = 'REJECTED', invoice_id = NULL, rejected_at = now(), reason = '   '" },
  { name: 'orders_active_has_address', table: 'orders', invalid: 'address_snapshot = NULL' },
  { name: 'invoices_paid_time_matches_status', table: 'invoices', invalid: "status = 'PAID', paid_at = NULL" },
  { name: 'invoices_void_time_matches_status', table: 'invoices', invalid: "status = 'VOID', voided_at = NULL" },
  { name: 'price_tiers_none_fields', table: 'price_tiers', invalid: 'factor_milli = 1000' },
  { name: 'price_tiers_cost_multiplier_fields', table: 'price_tiers', invalid: "derivation_kind = 'COST_MULTIPLIER', factor_milli = 0" },
  { name: 'price_tiers_percent_over_tier_fields', table: 'price_tiers', invalid: "derivation_kind = 'PERCENT_OVER_TIER', percent_bp = -10000, base_tier_id = id" },
  { name: 'price_tiers_default_active', table: 'price_tiers', invalid: 'is_active = false' },
  { name: 'order_line_combos_unit_covers_dish_price', table: 'order_line_combos', invalid: 'unit_price_cents = 99' },
  { name: 'companies_delivery_time_hhmm', table: 'companies', invalid: "default_delivery_time = '24:00'" },
  { name: 'orders_delivery_time_hhmm', table: 'orders', invalid: "delivery_time = '9:00'" },
  { name: 'drops_delivery_time_hhmm', table: 'drops', invalid: "delivery_time = '12:60'" },
  { name: 'companies_working_days_required', table: 'companies', invalid: 'working_days = NULL' },
];

describe('domain constraints', () => {
  it.each(cases)('$name accepts valid data and rejects a violation', async ({ name, table, invalid }) => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const ids = Array.from({ length: 8 }, () => randomUUID());
    const [actor, order, line, combo, prep, drop, invoice, tier] = ids;
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO staff_users (id, name, email, password_hash, role, updated_at)
        VALUES ($1, 'Constraint Actor', $2, 'hash', 'ADMIN', now())`, [actor, `${actor}@example.com`]);
      await client.query(`INSERT INTO invoices (id, company_id, total_cents, updated_at)
        VALUES ($1, $2, 100, now())`, [invoice, fixtureIds.company[0]]);
      await client.query(`INSERT INTO orders (id, employee_id, company_id, delivery_date, delivery_time,
        address_id, address_snapshot, created_by_staff_id, status, placed_at, confirmed_at, invoice_id, updated_at)
        VALUES ($1, $2, $3, DATE '2026-10-20', '12:00', $4, '{}'::jsonb, $5,
        'CONFIRMED', '2026-10-20 08:00Z', '2026-10-20 09:00Z', $6, now())`,
      [order, fixtureIds.employee[0], fixtureIds.company[0], fixtureIds.address[0], actor, invoice]);
      await client.query(`INSERT INTO order_lines (id, order_id, dish_id, dish_snapshot, quantity, line_total_cents, updated_at)
        VALUES ($1, $2, $3, '{}'::jsonb, 1, 100, now())`, [line, order, fixtureIds.dish[0]]);
      await client.query(`INSERT INTO order_line_combos (id, order_line_id, quantity, dish_price_cents,
        unit_price_cents, options_snapshot, combo_key, updated_at)
        VALUES ($1, $2, 1, 100, 100, '[]'::jsonb, 'test', now())`, [combo, line]);
      await client.query(`INSERT INTO prep_units (id, combo_id, started_at, started_by_id, done_at, done_by_id, updated_at)
        VALUES ($1, $2, '2026-10-20 09:00Z', $3, '2026-10-20 10:00Z', $3, now())`, [prep, combo, actor]);
      await client.query(`INSERT INTO order_kitchen_state (order_id, started_at, ready_at, updated_at)
        VALUES ($1, '2026-10-20 09:00Z', '2026-10-20 10:00Z', now())`, [order]);
      await client.query(`INSERT INTO drops (id, delivery_date, company_id, address_id, delivery_time,
        delivered_at, delivered_by_id, on_time, updated_at)
        VALUES ($1, DATE '2026-10-20', $2, $3, '12:00', '2026-10-20 12:00Z', $4, true, now())`,
      [drop, fixtureIds.company[0], fixtureIds.address[0], actor]);
      await client.query(`INSERT INTO order_dispatch_state (order_id, drop_id, dispatch_ready_at,
        out_for_delivery_at, delivered_at, updated_at)
        VALUES ($1, $2, '2026-10-20 10:00Z', '2026-10-20 11:00Z', '2026-10-20 12:00Z', now())`, [order, drop]);
      await client.query(`INSERT INTO price_tiers (id, name, updated_at)
        VALUES ($1, $2, now())`, [tier, `Constraint ${tier}`]);

      const key = table === 'companies' ? fixtureIds.company[0] : table === 'price_tiers'
        ? (name === 'price_tiers_default_active' ? fixtureIds.tier[0] : tier)
        : table === 'invoices' ? invoice : table === 'drops' ? drop : table === 'prep_units' ? prep
          : table === 'order_line_combos' ? combo : order;
      const keyColumn = ['order_kitchen_state', 'order_dispatch_state'].includes(table) ? 'order_id' : 'id';
      await client.query(`UPDATE ${table} SET updated_at = now() WHERE ${keyColumn} = $1`, [key]);
      await client.query('SAVEPOINT before_invalid');
      await expect(client.query(`UPDATE ${table} SET ${invalid} WHERE ${keyColumn} = $1`, [key]))
        .rejects.toMatchObject({ code: '23514', constraint: name });
      await client.query('ROLLBACK TO SAVEPOINT before_invalid');
    } finally {
      await client.query('ROLLBACK');
      await client.end();
    }
  });

  it('allocates 20 unique consecutive invoice numbers concurrently', async () => {
    const invoices = await Promise.all(Array.from({ length: 20 }, () =>
      db.invoice.create({ data: { companyId: fixtureIds.company[0], totalCents: 0 } })));
    const numbers = invoices.map(invoice => Number(invoice.number.slice(4))).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(20);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, index) => numbers[0] + index));
    expect(invoices.every(invoice => /^INV-\d{6,}$/.test(invoice.number))).toBe(true);
  });
});
