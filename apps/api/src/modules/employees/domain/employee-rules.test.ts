import { describe, expect, it } from 'vitest';
import { emailMatchesCompany, normalizeEmail } from './employee-rules.js';
describe('employee email rules', () => {
  it('normalizes case and checks the exact claimed domain', () => {
    expect(normalizeEmail(' A@Corp.Test ')).toBe('a@corp.test');
    expect(emailMatchesCompany('A@Corp.Test', ['corp.test'])).toBe(true);
    expect(emailMatchesCompany('a@othercorp.test', ['corp.test'])).toBe(false);
  });
});
