export function assertCents(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Money must be nonnegative integer cents');
  return value;
}

export function ceilDiv(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || numerator < 0 || !Number.isSafeInteger(denominator) || denominator <= 0) throw new RangeError('Expected nonnegative integer numerator and positive integer denominator');
  return Math.floor(numerator / denominator) + (numerator % denominator === 0 ? 0 : 1);
}

export function roundUpTo5Cents(cents: number): number { return ceilDiv(assertCents(cents), 5) * 5; }
export function formatMoney(cents: number): string {
  const amount = assertCents(cents);
  const dollars = Math.floor(amount / 100).toLocaleString('en-US');
  return `$${dollars}.${String(amount % 100).padStart(2, '0')}`;
}
