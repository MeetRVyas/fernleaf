import { Controller, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { login, logout, me, type InputOf, type Role } from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { env } from '../../core/config.js';
import { AuthService } from './auth.service.js';
@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}
  @Route(login) async login(@Input() input: InputOf<typeof login>, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.login(input.body.email, input.body.password);
    response.cookie('session', result.token, { httpOnly: true, secure: env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return result.user;
  }
  @Route(logout) async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) { const token: unknown = request.cookies?.session; if (typeof token === 'string') await this.service.logout(token); response.clearCookie('session', { path: '/api' }); return { ok: true as const }; }
  @Route(me) me(@Req() request: Request & { user?: { id: string; role: Role } }) { return this.service.me(request.user!.id); }
}
