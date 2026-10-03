import { Controller, Inject } from '@nestjs/common';
import { health, ready, docs, allRoutes, type RouteDescriptor } from '@fernleaf/shared';
import { z } from 'zod';
import { Route } from './route.js';
import { PrismaService } from './prisma.service.js';
function statusForCode(code: string): string {
  return ({ UNAUTHENTICATED: '401', FORBIDDEN: '403', NOT_FOUND: '404', CONFLICT: '409', THROTTLED: '429', VALIDATION_ERROR: '422' } as Record<string, string>)[code] ?? '422';
}
@Controller()
export class HealthController {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  @Route(health) health(): { ok: true } { return { ok: true }; }
  @Route(ready) async ready(): Promise<{ ok: true }> { await this.db.$queryRaw`SELECT 1`; return { ok: true }; }
  @Route(docs) docs() {
    const paths: Record<string, Record<string, unknown>> = {};
    for (const route of allRoutes as readonly RouteDescriptor[]) {
      const path = route.path.replace(/:([a-zA-Z]+)/g, '{$1}');
      paths[path] ??= {};
      const parameters: unknown[] = [];
      for (const [schema, location] of [[route.params, 'path'], [route.query, 'query']] as const) {
        if (!schema) continue;
        const json = z.toJSONSchema(schema);
        const properties = json.properties ?? {};
        for (const [name, property] of Object.entries(properties)) parameters.push({ name, in: location, required: location === 'path' || (json.required ?? []).includes(name), schema: property });
      }
      paths[path][route.method.toLowerCase()] = {
        operationId: route.id,
        parameters,
        ...(route.body ? { requestBody: { required: true, content: { 'application/json': { schema: z.toJSONSchema(route.body) } } } } : {}),
        responses: { 200: { description: 'Success', content: { 'application/json': { schema: z.toJSONSchema(route.response) } } }, ...Object.fromEntries(route.errors.map(code => [statusForCode(code), { description: code }])) },
      };
    }
    return { openapi: '3.1.0', info: { title: 'Fernleaf Kitchen API', version: '0.0.0' }, paths };
  }
}
