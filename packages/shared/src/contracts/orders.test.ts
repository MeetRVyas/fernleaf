import { describe, expect, it } from 'vitest';
import { buildClient } from './route.js';
import { listOrders, orderListQuery } from './orders.js';

describe('order list filter convention', () => {
  it('accepts a single status or repeated status query keys', () => {
    expect(orderListQuery.parse({ status: 'PLACED' }).status).toEqual([
      'PLACED',
    ]);
    expect(
      orderListQuery.parse({ status: ['PLACED', 'CONFIRMED'] }).status,
    ).toEqual(['PLACED', 'CONFIRMED']);
  });
  it('writes arrays as repeated query keys in the typed client', async () => {
    let url = '';
    const fetcher: typeof fetch = async (input) => {
      url = String(input);
      return new Response(
        JSON.stringify({ items: [], total: 0, page: 1, pageSize: 25 }),
        { status: 200 },
      );
    };
    await buildClient('/api', fetcher).call(listOrders, {
      query: {
        page: 1,
        pageSize: 25,
        invoiced: 'any',
        status: ['PLACED', 'CONFIRMED'],
      },
    });
    expect(
      new URL(url, 'http://localhost').searchParams.getAll('status'),
    ).toEqual(['PLACED', 'CONFIRMED']);
  });
});
