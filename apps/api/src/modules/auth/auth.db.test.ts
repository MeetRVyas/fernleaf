import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { allRoutes, can, me, ROLES, type Role } from '@fernleaf/shared';
import { AppModule } from '../../app.module.js';
import { PrismaService } from '../../core/prisma.service.js';

let app: INestApplication;
let base: string;
let db: PrismaService;
const sessions = new Map<Role, string>();

beforeAll(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.use(cookieParser());
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
    const spec = await docsResponse.json() as { paths: Record<string, Record<string, { requestBody?: unknown }>> };
    expect(spec.paths['/auth/login'].post.requestBody).toBeDefined();
    expect(spec.paths['/staff'].get).toBeDefined();
    expect(spec.paths['/staff'].post).toBeDefined();
  });
  it('logs in and parses the me response with its contract', async () => {
    const loginResponse = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@test.com', password: 'Test@1234' }) });
    expect(loginResponse.status).toBe(201);
    const cookie = loginResponse.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    const meResponse = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie!.split(';')[0] } });
    expect(meResponse.status).toBe(200);
    me.response.parse(await meResponse.json());
  });
  it('logs out the current session', async () => {
    const token = sessions.get('KITCHEN')!;
    const logoutResponse = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: `session=${token}` } });
    expect(logoutResponse.status).toBe(201);
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
    expect(reset.status).toBe(201);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Replaced@1234' }) });
    expect(login.status).toBe(201);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const deactivated = await fetch(`${base}/staff/${staff.id}/deactivate`, { method: 'POST', headers: admin });
    expect(deactivated.status).toBe(201);
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
});
