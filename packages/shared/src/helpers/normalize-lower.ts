/** Normalize identifiers before writes to lowercase-constrained columns. */
export function normalizeLower(value: string): string {
  return value.trim().toLowerCase();
}
