import { z } from 'zod';
import type { Permission } from '../permissions/roles.js';
import type { ErrorCode } from '../helpers/errors.js';
export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type RouteDescriptor = {
  id: string;
  method: Method;
  path: string;
  permission: Permission | null;
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  response: z.ZodType;
  errors: readonly ErrorCode[];
};
export function defineRoute<T extends RouteDescriptor>(route: T): T {
  return route;
}
export type InputOf<T extends RouteDescriptor> = {
  params: T['params'] extends z.ZodType ? z.infer<T['params']> : undefined;
  query: T['query'] extends z.ZodType ? z.infer<T['query']> : undefined;
  body: T['body'] extends z.ZodType ? z.infer<T['body']> : undefined;
};
export function buildClient(baseUrl: string, fetcher: typeof fetch = fetch) {
  return {
    async call<T extends RouteDescriptor>(
      route: T,
      input: Partial<InputOf<T>> = {},
    ): Promise<z.infer<T['response']>> {
      let path = route.path;
      for (const [key, value] of Object.entries(
        (input.params ?? {}) as Record<string, string>,
      ))
        path = path.replace(`:${key}`, encodeURIComponent(value));
      const query = new URLSearchParams();
      // Multi-value filters use repeated keys: ?status=PLACED&status=CONFIRMED.
      // arrayQueryParam accepts both one key and repeated keys on the server.
      for (const [key, value] of Object.entries(
        (input.query ?? {}) as Record<string, unknown>,
      )) {
        const values = Array.isArray(value) ? value : [value];
        for (const item of values)
          if (item !== undefined && item !== null && item !== '')
            query.append(key, String(item));
      }
      const response = await fetcher(
        `${baseUrl}${path}${query.size ? `?${query}` : ''}`,
        {
          method: route.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body:
            input.body === undefined ? undefined : JSON.stringify(input.body),
        },
      );
      const json: unknown = await response.json();
      if (!response.ok) throw json;
      return route.response.parse(json) as z.infer<T['response']>;
    },
  };
}
