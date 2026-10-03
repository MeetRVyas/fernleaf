import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import type { RouteDescriptor } from '@fernleaf/shared';
import { CONTRACT_KEY } from './route.js';
import { env } from './config.js';
@Injectable()
export class InputInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const route = this.reflector.get<RouteDescriptor>(CONTRACT_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest<Request & { routeInput?: unknown }>();
    request.routeInput = { params: route?.params?.parse(request.params), query: route?.query?.parse(request.query), body: route?.body?.parse(request.body) };
    const result = next.handle();
    return env.VALIDATE_RESPONSES === 'true' && route ? result.pipe(map(value => {
      const parsed = route.response.safeParse(value);
      if (!parsed.success) throw new Error(`Response violates ${route.id} contract`, { cause: parsed.error });
      return parsed.data;
    })) : result;
  }
}
