import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { Controller, Module, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { allRoutes, can, me, ROLES, ROLE_PERMISSIONS, defineRoute, type Role } from '@fernleaf/shared';
import { z } from 'zod';
import { Route } from '../../core/route.js';
import { AppModule } from '../../app.module.js';
import { PrismaService } from '../../core/prisma.service.js';
import { AuthService } from './auth.service.js';

let app: INestApplication;
let base: string;
let db: PrismaService;
const sessions = new Map<Role, string>();
const throwsRoute = defineRoute({ id: 'test.throws', method: 'GET', path: '/test/throws', permission: null, response: z.object({ ok: z.literal(true) }), errors: [] });
const invalidResponseRoute = defineRoute({ id: 'test.invalidResponse', method: 'GET', path: '/test/invalid-response', permission: null, response: z.object({ ok: z.literal(true) }), errors: [] });
@Controller()
class ThrowingController {
  @Route(throwsRoute) go(): never { throw new Error('test failure'); }
  @Route(invalidResponseRoute) badResponse() { return { ok: false }; }
}
@Module({ imports: [AppModule], controllers: [ThrowingController] })
class TestAppModule {}

beforeAll(async () => {
  app = await NestFactory.create(TestAppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  await app.listen(0);
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP server');
  base = `http://127.0.0.1:${address.port}/api`;
  db = app.get(PrismaService);
  const passwordHash = await hash('Test@1234');
  for (const role of ROLES) {
    const user = await db.staffUser.create({ data: { name: role, email: `${role.toLowerCase()}@test.com`, role, passwordHash } });
    const token = `${role}-test-token`;
    sessions.set(role, token);
    await db.session.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date('2099-01-01T00:00:00Z') } });
  }
});
afterAll(async () => { await app?.close(); });
beforeEach(async () => {
  for (const role of ROLES) {
    const tokenHash = createHash('sha256').update(sessions.get(role)!).digest('hex');
    const user = await db.staffUser.findUniqueOrThrow({ where: { email: `${role.toLowerCase()}@test.com` } });
    await db.session.upsert({ where: { tokenHash }, update: {}, create: { userId: user.id, tokenHash, expiresAt: new Date('2099-01-01T00:00:00Z') } });
  }
});

function url(path: string): string { return `${base}${path.replace(/:id/g, '00000000-0000-0000-0000-000000000001')}`; }

describe('contract generated permission matrix', () => {
  for (const route of allRoutes) {
    if (route.permission === null) continue;
    it(`${route.id} denies anonymous requests`, async () => {
      const response = await fetch(url(route.path), { method: route.method, headers: { 'Content-Type': 'application/json' }, body: route.method === 'GET' ? undefined : '{}' });
      expect(response.status).toBe(401);
    });
    for (const role of ROLES) {
      it(`${route.id} applies ${role} permission`, async () => {
        const response = await fetch(url(route.path), { method: route.method, headers: { Cookie: `session=${sessions.get(role)}`, 'Content-Type': 'application/json' }, body: route.method === 'GET' ? undefined : '{}' });
        expect(response.status).toBeLessThan(500);
        if (can({ role }, route.permission!)) expect([401, 403]).not.toContain(response.status);
        else expect(response.status).toBe(403);
      });
    }
  }
});

describe('auth and contract conformance', () => {
  it('serves health without a session and documents contract inputs', async () => {
    const healthResponse = await fetch(`${base}/health`);
    expect(healthResponse.status).toBe(200);
    expect(await healthResponse.json()).toEqual({ ok: true });
    const docsResponse = await fetch(`${base}/docs`);
    expect(docsResponse.status).toBe(200);
    const spec = await docsResponse.json() as { paths: Record<string, Record<string, { requestBody?: unknown; responses: Record<string, unknown> }>> };
    expect(spec.paths['/auth/login'].post.requestBody).toBeDefined();
    expect(spec.paths['/staff'].get).toBeDefined();
    expect(spec.paths['/staff'].post).toBeDefined();
    expect(spec.paths['/staff'].post.responses['201']).toBeDefined();
    expect(spec.paths['/auth/login'].post.responses['200']).toBeDefined();
    expect(spec.paths['/auth/login'].post.responses['422']).toBeDefined();
  });
  it('logs in and parses the me response with its contract', async () => {
    const loginResponse = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@test.com', password: 'Test@1234' }) });
    expect(loginResponse.status).toBe(200);
    const cookie = loginResponse.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    const meResponse = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie!.split(';')[0] } });
    expect(meResponse.status).toBe(200);
    expect(me.response.parse(await meResponse.json()).permissions).toEqual(ROLE_PERMISSIONS.ADMIN);
  });
  it('logs out the current session', async () => {
    const token = sessions.get('KITCHEN')!;
    const logoutResponse = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: `session=${token}` } });
    expect(logoutResponse.status).toBe(200);
    const meResponse = await fetch(`${base}/auth/me`, { headers: { Cookie: `session=${token}` } });
    expect(meResponse.status).toBe(401);
  });
  it('supports the complete staff administration flow', async () => {
    const admin = { Cookie: `session=${sessions.get('ADMIN')!}`, 'Content-Type': 'application/json' };
    const email = `new-${randomUUID()}@test.com`;
    const created = await fetch(`${base}/staff`, { method: 'POST', headers: admin, body: JSON.stringify({ name: 'New Staff', email, role: 'KITCHEN', password: 'Initial@1234' }) });
    expect(created.status).toBe(201);
    const staff = await created.json() as { id: string; role: string; passwordHash?: string };
    expect(staff.passwordHash).toBeUndefined();
    const list = await fetch(`${base}/staff?page=1&pageSize=2`, { headers: admin });
    expect(list.status).toBe(200);
    expect((await list.json() as { pageSize: number }).pageSize).toBe(2);
    const changed = await fetch(`${base}/staff/${staff.id}/role`, { method: 'PATCH', headers: admin, body: JSON.stringify({ role: 'DRIVER' }) });
    expect(changed.status).toBe(200);
    expect((await changed.json() as { role: string }).role).toBe('DRIVER');
    const reset = await fetch(`${base}/staff/${staff.id}/reset-password`, { method: 'POST', headers: admin, body: JSON.stringify({ password: 'Replaced@1234' }) });
    expect(reset.status).toBe(200);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Replaced@1234' }) });
    expect(login.status).toBe(200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const deactivated = await fetch(`${base}/staff/${staff.id}/deactivate`, { method: 'POST', headers: admin });
    expect(deactivated.status).toBe(200);
    expect((await deactivated.json() as { isActive: boolean }).isActive).toBe(false);
    expect((await fetch(`${base}/auth/me`, { headers: { Cookie: cookie } })).status).toBe(401);
  });
  it('maps duplicate emails and missing staff to contract errors', async () => {
    const admin = { Cookie: `session=${sessions.get('ADMIN')!}`, 'Content-Type': 'application/json' };
    const duplicate = await fetch(`${base}/staff`, { method: 'POST', headers: admin, body: JSON.stringify({ name: 'Duplicate', email: 'admin@test.com', role: 'ADMIN', password: 'Test@1234' }) });
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json() as { code: string }).code).toBe('CONFLICT');
    const missing = await fetch(`${base}/staff/${randomUUID()}/role`, { method: 'PATCH', headers: admin, body: JSON.stringify({ role: 'DRIVER' }) });
    expect(missing.status).toBe(404);
    expect((await missing.json() as { code: string }).code).toBe('NOT_FOUND');
  });
  it('throttles repeated failed logins', async () => {
    const email = `unknown-${randomUUID()}@test.com`;
    for (let count = 0; count < 5; count++) {
      const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'wrong' }) });
      expect(response.status).toBe(401);
    }
    const throttled = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'wrong' }) });
    expect(throttled.status).toBe(429);
    expect((await throttled.json() as { code: string }).code).toBe('THROTTLED');
  });
  it('scopes login failures by client IP', async () => {
    const body = JSON.stringify({ email: 'admin@test.com', password: 'wrong' });
    for (let count = 0; count < 5; count++) {
      const failed = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.10' }, body });
      expect(failed.status).toBe(401);
    }
    const blocked = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.10' }, body: JSON.stringify({ email: 'admin@test.com', password: 'Test@1234' }) });
    expect(blocked.status).toBe(429);
    const allowed = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.11' }, body: JSON.stringify({ email: 'admin@test.com', password: 'Test@1234' }) });
    expect(allowed.status).toBe(200);
  });
  it('returns distinct malformed JSON and validation errors', async () => {
    const malformed = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    expect(malformed.status).toBe(400);
    expect((await malformed.json() as { code: string }).code).toBe('MALFORMED_JSON');
    const invalid = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'validation-test' }, body: JSON.stringify({ email: 'bad', password: '' }) });
    expect(invalid.status).toBe(422);
    const error = await invalid.json() as { code: string; details: Record<string, string>; requestId: string };
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details.email).toBeDefined();
    expect(error.requestId).toBe('validation-test');
  });
  it('maps a thrown route error to 500 with its request ID', async () => {
    const response = await fetch(`${base}/test/throws`, { headers: { 'X-Request-Id': 'throw-test' } });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error', requestId: 'throw-test' });
  });
  it('rejects a response that violates its contract in tests', async () => {
    const response = await fetch(`${base}/test/invalid-response`);
    expect(response.status).toBe(500);
    expect((await response.json() as { code: string }).code).toBe('INTERNAL_ERROR');
  });
  it('rejects changing your own role or deactivating yourself', async () => {
    const user = await db.staffUser.findUniqueOrThrow({ where: { email: 'admin@test.com' } });
    const headers = { Cookie: `session=${sessions.get('ADMIN')!}`, 'Content-Type': 'application/json' };
    const role = await fetch(`${base}/staff/${user.id}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role: 'DRIVER' }) });
    expect(role.status).toBe(422);
    const deactivate = await fetch(`${base}/staff/${user.id}/deactivate`, { method: 'POST', headers });
    expect(deactivate.status).toBe(422);
    expect((await db.staffUser.findUniqueOrThrow({ where: { id: user.id } })).isActive).toBe(true);
  });
  it('retains the last active admin', async () => {
    const admin = await db.staffUser.findUniqueOrThrow({ where: { email: 'admin@test.com' } });
    await expect(app.get(AuthService).deactivate(randomUUID(), admin.id)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(app.get(AuthService).changeRole(randomUUID(), admin.id, 'DRIVER')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect((await db.staffUser.findUniqueOrThrow({ where: { id: admin.id } })).isActive).toBe(true);
  });
});
