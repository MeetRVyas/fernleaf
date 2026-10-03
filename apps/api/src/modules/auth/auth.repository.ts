import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  findByEmail(email: string) { return this.db.staffUser.findUnique({ where: { email } }); }
  findById(id: string) { return this.db.staffUser.findUnique({ where: { id } }); }
  createSession(userId: string, tokenHash: string, expiresAt: Date) { return this.db.session.create({ data: { userId, tokenHash, expiresAt } }); }
  deleteSession(tokenHash: string) { return this.db.session.deleteMany({ where: { tokenHash } }); }
  deleteSessionsForUser(userId: string) { return this.db.session.deleteMany({ where: { userId } }); }
  list(skip: number, take: number) { return this.db.staffUser.findMany({ skip, take, orderBy: { name: 'asc' } }); }
  count() { return this.db.staffUser.count(); }
  create(data: { name: string; email: string; role: string; passwordHash: string }) { return this.db.staffUser.create({ data }); }
  update(id: string, data: { role?: string; isActive?: boolean; passwordHash?: string }) { return this.db.staffUser.update({ where: { id }, data }); }
}
