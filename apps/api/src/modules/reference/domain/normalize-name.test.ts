import { describe, expect, it } from 'vitest';
import { normalizeName } from './normalize-name.js';

describe('normalizeName', () => {
  it('removes surrounding whitespace', () => {
    expect(normalizeName('  Milk  ')).toBe('Milk');
  });
});
