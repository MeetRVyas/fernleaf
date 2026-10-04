import { describe, expect, it } from 'vitest';
import { ALL, PERM, ROLE_PERMISSIONS, ROLES, can } from './roles.js';
import { allRoutes } from '../contracts/index.js';

describe('permission registry', () => {
  it('grants every permission to admin and only requested work to other roles', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(ALL);
    expect(can({ role: 'KITCHEN' }, PERM.kitchen.finish)).toBe(true);
    expect(can({ role: 'KITCHEN' }, PERM.catalogue.read)).toBe(true);
    expect(can({ role: 'KITCHEN' }, PERM.orders.create)).toBe(false);
    expect(can({ role: 'DISPATCH' }, PERM.companies.read)).toBe(true);
    expect(can({ role: 'DRIVER' }, PERM.dispatch.ownDeliver)).toBe(true);
    expect(can({ role: 'DRIVER' }, PERM.dispatch.deliver)).toBe(false);
  });
  it('covers every protected route without duplicate route ids', () => {
    expect(new Set(allRoutes.map((route) => route.id)).size).toBe(
      allRoutes.length,
    );
    for (const route of allRoutes) {
      if (route.permission === null) continue;
      expect(ALL).toContain(route.permission);
      for (const role of ROLES)
        expect(typeof can({ role }, route.permission)).toBe('boolean');
    }
  });
});
