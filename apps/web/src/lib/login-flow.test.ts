import { describe, expect, it, vi } from 'vitest';
import { loginAndRedirect } from './login-flow';

describe('login redirect', () => {
  it.each([
    ['ADMIN', '/admin'],
    ['KITCHEN', '/kitchen'],
    ['DISPATCH', '/dispatch'],
    ['DRIVER', '/driver'],
  ] as const)('sends %s to %s after successful login', async (role, path) => {
    const redirect = vi.fn();
    const authenticate = vi.fn().mockResolvedValue({ role });
    const values = { email: 'staff@test.com', password: 'Test@1234' };
    await loginAndRedirect(values, redirect, authenticate);
    expect(authenticate).toHaveBeenCalledWith(values);
    expect(redirect).toHaveBeenCalledWith(path);
  });
});
