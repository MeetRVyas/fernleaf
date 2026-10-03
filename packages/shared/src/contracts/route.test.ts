import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { arrayQueryParam, buildClient, defineRoute } from '../index.js';

const route = defineRoute({ id: 'test.query', method: 'GET', path: '/test', permission: null, query: z.object({ tags: arrayQueryParam(z.string()), optional: z.string().optional() }), response: z.object({ ok: z.literal(true) }), errors: [] });
const optionalRoute = defineRoute({ id: 'test.optionalQuery', method: 'GET', path: '/test', permission: null, query: z.record(z.string(), z.unknown()), response: z.object({ ok: z.literal(true) }), errors: [] });

describe('shared client query encoding', () => {
  it('omits empty values and repeats array keys', async () => {
    let requested = '';
    const fetcher = async (input: RequestInfo | URL) => { requested = String(input); return new Response(JSON.stringify({ ok: true }), { status: 200 }); };
    await buildClient('/api', fetcher as typeof fetch).call(route, { query: { tags: ['one', 'two'], optional: '' } });
    expect(requested).toBe('/api/test?tags=one&tags=two');
    expect(route.query.parse({ tags: 'one' }).tags).toEqual(['one']);
    expect(route.query.parse({ tags: ['one', 'two'] }).tags).toEqual(['one', 'two']);
    await buildClient('/api', fetcher as typeof fetch).call(optionalRoute, { query: { missing: undefined, empty: '', nil: null, page: 2 } });
    expect(requested).toBe('/api/test?page=2');
  });
});
