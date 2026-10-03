import { Inject, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from '../../core/api-error.js';
import { AuthRepository } from './auth.repository.js';
import type { Role } from '@fernleaf/shared';
import { Clock } from '../../core/clock.js';

function publicUser(user: { id: string; name: string; email: string; role: string; isActive: boolean }) { return { id: user.id, name: user.name, email: user.email, role: user.role as Role, isActive: user.isActive }; }
@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; until: number }>();
  constructor(@Inject(AuthRepository) private readonly repo: AuthRepository, @Inject(Clock) private readonly clock: Clock) {}
  async login(email: string, password: string) {
    const key = email.toLowerCase();
    const now = this.clock.now().getTime();
    const attempt = this.attempts.get(key);
    if (attempt && attempt.count >= 5 && attempt.until > now) throw new ApiError('THROTTLED', 'Too many login attempts', 429);
    const user = await this.repo.findByEmail(email.toLowerCase());
    if (!user || !user.isActive || !(await verify(user.passwordHash, password))) {
      this.attempts.set(key, { count: (attempt && attempt.until > now ? attempt.count : 0) + 1, until: now + 15 * 60 * 1000 });
      throw new ApiError('UNAUTHENTICATED', 'Invalid credentials', 401);
    }
    this.attempts.delete(key);
    const token = randomBytes(32).toString('base64url');
    await this.repo.createSession(user.id, createHash('sha256').update(token).digest('hex'), new Date(now + 7 * 24 * 60 * 60 * 1000));
    return { user: publicUser(user), token };
  }
  async logout(token: string): Promise<void> { await this.repo.deleteSession(createHash('sha256').update(token).digest('hex')); }
  async me(id: string) { const user = await this.repo.findById(id); if (!user) throw new ApiError('NOT_FOUND', 'Staff member not found', 404); return publicUser(user); }
  async list(page: number, pageSize: number) { const [items, total] = await Promise.all([this.repo.list((page - 1) * pageSize, pageSize), this.repo.count()]); return { items: items.map(publicUser), total, page, pageSize }; }
  async create(input: { name: string; email: string; role: Role; password: string }) { const user = await this.repo.create({ name: input.name, email: input.email.toLowerCase(), role: input.role, passwordHash: await hash(input.password) }); return publicUser(user); }
  async changeRole(id: string, role: Role) { return publicUser(await this.repo.update(id, { role })); }
  async deactivate(id: string) { const user = await this.repo.update(id, { isActive: false }); await this.repo.deleteSessionsForUser(id); return publicUser(user); }
  async resetPassword(id: string, password: string) { await this.repo.update(id, { passwordHash: await hash(password) }); await this.repo.deleteSessionsForUser(id); return { ok: true as const }; }
}
