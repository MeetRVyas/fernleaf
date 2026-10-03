import { z } from 'zod';
import { defineRoute } from './route.js';
export const health = defineRoute({ id: 'core.health', method: 'GET', path: '/health', permission: null, response: z.object({ ok: z.literal(true) }), errors: [] });
export const ready = defineRoute({ id: 'core.ready', method: 'GET', path: '/health/ready', permission: null, response: z.object({ ok: z.literal(true) }), errors: [] });
export const docs = defineRoute({ id: 'core.docs', method: 'GET', path: '/docs', permission: null, response: z.object({ openapi: z.string(), info: z.object({ title: z.string(), version: z.string() }), paths: z.record(z.string(), z.unknown()) }), errors: [] });
export const coreRoutes = [health, ready, docs] as const;
