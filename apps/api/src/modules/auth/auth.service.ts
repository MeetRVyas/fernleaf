import { Inject, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from '../../core/api-error.js';
import { AuthRepository } from './auth.repository.js';
import { ROLE_PERMISSIONS, isAdmin, type Role } from '@fernleaf/shared';
import { Clock } from '../../core/clock.js';
import { TxRunner } from '../../core/tx-runner.js';

function publicUser(user: { id: string; name: string; email: string; role: string; isActive: boolean }) { return { id: user.id, name: user.name, email: user.email, role: user.role as Role, isActive: user.isActive }; }
@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, number[]>();
  constructor(@Inject(AuthRepository) private readonly repo: AuthRepository, @Inject(Clock) private readonly clock: Clock, @Inject(TxRunner) private readonly txRunner: TxRunner) {}
  async login(email: string, password: string, ip: string) {
    const key = `${ip}:${email.trim().toLowerCase()}`;
    const now = this.clock.now().getTime();
    for (const [storedKey, times] of this.attempts) {
      const active = times.filter(time => time > now - 5 * 60_000);
      if (active.length) this.attempts.set(storedKey, active);
      else this.attempts.delete(storedKey);
    }
    const attempt = this.attempts.get(key) ?? [];
    if (attempt.length >= 5) throw new ApiError('THROTTLED', 'Too many login attempts', 429);
    const user = await this.repo.findByEmail(undefined, email.toLowerCase());
    if (!user || !user.isActive || !(await verify(user.passwordHash, password))) {
      this.attempts.set(key, [...attempt, now]);
      if (this.attempts.size > 10_000) this.attempts.delete(this.attempts.keys().next().value!);
      throw new ApiError('UNAUTHENTICATED', 'Invalid credentials', 401);
    }
    this.attempts.delete(key);
    const token = randomBytes(32).toString('base64url');
    await this.repo.createSession(undefined, user.id, createHash('sha256').update(token).digest('hex'), new Date(now + 7 * 24 * 60 * 60 * 1000));
    return { user: publicUser(user), token };
  }
  async logout(token: string): Promise<void> { await this.repo.deleteSession(undefined, createHash('sha256').update(token).digest('hex')); }
  async me(id: string) { const user = await this.repo.findById(undefined, id); if (!user) throw new ApiError('NOT_FOUND', 'Staff member not found', 404); return { ...publicUser(user), permissions: ROLE_PERMISSIONS[user.role as Role] }; }
  async list(page: number, pageSize: number) { const [items, total] = await Promise.all([this.repo.list(undefined, (page - 1) * pageSize, pageSize), this.repo.count()]); return { items: items.map(publicUser), total, page, pageSize }; }
  async create(input: { name: string; email: string; role: Role; password: string }) { const user = await this.repo.create(undefined, { name: input.name, email: input.email.toLowerCase(), role: input.role, passwordHash: await hash(input.password) }); return publicUser(user); }
  async changeRole(actorId: string, id: string, role: Role) {
    if (actorId === id) throw new ApiError('VALIDATION_ERROR', 'You cannot change your own role', 422);
    return this.txRunner.run(async tx => {
      await this.repo.lockStaffChanges(tx);
      const current = await this.repo.findById(tx, id);
      if (!current) throw new ApiError('NOT_FOUND', 'Staff member not found', 404);
      if (current.isActive && isAdmin({ role: current.role as Role }) && !isAdmin({ role })) await this.assertAnotherAdmin(id, tx);
      return publicUser(await this.repo.update(tx, id, { role }));
    });
  }
  async deactivate(actorId: string, id: string) {
    if (actorId === id) throw new ApiError('VALIDATION_ERROR', 'You cannot deactivate yourself', 422);
    return this.txRunner.run(async tx => {
      await this.repo.lockStaffChanges(tx);
      const current = await this.repo.findById(tx, id);
      if (!current) throw new ApiError('NOT_FOUND', 'Staff member not found', 404);
      if (current.isActive && isAdmin({ role: current.role as Role })) await this.assertAnotherAdmin(id, tx);
      const user = await this.repo.update(tx, id, { isActive: false });
      await this.repo.deleteSessionsForUser(tx, id);
      return publicUser(user);
    });
  }
  private async assertAnotherAdmin(id: string, tx: Parameters<AuthRepository['activeStaff']>[0]) {
    const active = await this.repo.activeStaff(tx);
    if (!active.some(user => user.id !== id && isAdmin({ role: user.role as Role }))) throw new ApiError('VALIDATION_ERROR', 'The last active admin cannot be removed', 422);
  }
  async resetPassword(id: string, password: string) { const passwordHash = await hash(password); return this.txRunner.run(async tx => { await this.repo.update(tx, id, { passwordHash }); await this.repo.deleteSessionsForUser(tx, id); return { ok: true as const }; }); }
}
