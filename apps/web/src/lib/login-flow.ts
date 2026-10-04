import type { Role } from '@fernleaf/shared';
import { landingPath } from './landing';

export async function loginAndRedirect(
  values: { email: string; password: string },
  redirect: (path: string) => void,
  authenticate: (values: { email: string; password: string }) => Promise<{ role: Role }>,
): Promise<void> {
  const user = await authenticate(values);
  redirect(landingPath(user));
}
