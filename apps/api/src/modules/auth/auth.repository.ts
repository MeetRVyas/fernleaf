import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';
@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  findByEmail(tx: Tx | undefined, email: string) { return (tx ?? this.db).staffUser.findUnique({ where: { email } }); }
  findById(tx: Tx | undefined, id: string) { return (tx ?? this.db).staffUser.findUnique({ where: { id } }); }
  createSession(tx: Tx | undefined, userId: string, tokenHash: string, expiresAt: Date) { return (tx ?? this.db).session.create({ data: { userId, tokenHash, expiresAt } }); }
  deleteSession(tx: Tx | undefined, tokenHash: string) { return (tx ?? this.db).session.deleteMany({ where: { tokenHash } }); }
  deleteSessionsForUser(tx: Tx | undefined, userId: string) { return (tx ?? this.db).session.deleteMany({ where: { userId } }); }
  list(tx: Tx | undefined, skip: number, take: number) { return (tx ?? this.db).staffUser.findMany({ skip, take, orderBy: { name: 'asc' } }); }
  count(tx?: Tx) { return (tx ?? this.db).staffUser.count(); }
  create(tx: Tx | undefined, data: { name: string; email: string; role: string; passwordHash: string }) { return (tx ?? this.db).staffUser.create({ data }); }
  update(tx: Tx | undefined, id: string, data: { role?: string; isActive?: boolean; passwordHash?: string }) { return (tx ?? this.db).staffUser.update({ where: { id }, data }); }
  activeStaff(tx?: Tx) { return (tx ?? this.db).staffUser.findMany({ where: { isActive: true }, select: { id: true, role: true } }); }
  async lockStaffChanges(tx: Tx): Promise<void> { await tx.$executeRaw`SELECT pg_advisory_xact_lock(68294710)`; }
}
