import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
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
});
