export function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
export function emailMatchesCompany(email: string, domains: readonly string[]): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  return at > 0 && domains.includes(normalized.slice(at + 1));
}
