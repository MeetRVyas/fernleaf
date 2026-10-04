import { describe, expect, it } from 'vitest';
import { normalizeSku, hasDuplicateOptionIds, validSingleChoice } from './catalogue-rules.js';

describe('catalogue rules', () => {
  it('normalizes SKU before uniqueness checks', () => expect(normalizeSku(' ABC ')).toBe('abc'));
  it('rejects duplicate group membership', () => {
    const choices = [{ optionId: 'one' }, { optionId: 'one' }];
    expect(hasDuplicateOptionIds(choices)).toBe(true);
    expect(hasDuplicateOptionIds([{ optionId: 'one' }])).toBe(false);
  });
  it('requires one option from a required single-choice group', () => {
    expect(validSingleChoice(true, [])).toBe(false);
    expect(validSingleChoice(true, ['one'])).toBe(true);
    expect(validSingleChoice(true, ['one', 'two'])).toBe(false);
    expect(validSingleChoice(false, [])).toBe(true);
  });
});
