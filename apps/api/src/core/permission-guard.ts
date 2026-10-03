import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { can, type Role } from '@fernleaf/shared';
import { CONTRACT_KEY } from './route.js';
import type { RouteDescriptor } from '@fernleaf/shared';
import { PrismaService } from './prisma.service.js';
import { createHash } from 'node:crypto';
import { Clock } from './clock.js';
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(PrismaService) private readonly db: PrismaService, @Inject(Clock) private readonly clock: Clock) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const route = this.reflector.get<RouteDescriptor>(CONTRACT_KEY, context.getHandler());
    if (!route) throw new Error('Every route needs a contract');
    if (route.permission === null) return true;
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string; role: Role } }>();
    const token = request.cookies?.session;
    const session = typeof token === 'string' ? await this.db.session.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') }, include: { user: true } }) : null;
    const user = session && session.expiresAt > this.clock.now() && session.user.isActive ? { id: session.user.id, role: session.user.role as Role } : undefined;
    if (!user) throw new UnauthorizedException();
    if (!can(user, route.permission)) throw new ForbiddenException();
    request.user = user;
    return true;
  }
}
