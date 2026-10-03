import { describe, expect, it } from 'vitest';
import { roundUpTo5Cents } from './money.js';
describe('roundUpTo5Cents', () => { it.each([[211,215],[210,210],[1,5],[0,0],[214,215],[216,220]])('%i -> %i', (input, expected) => expect(roundUpTo5Cents(input)).toBe(expected)); });
