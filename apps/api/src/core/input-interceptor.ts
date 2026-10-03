import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type { RouteDescriptor } from '@fernleaf/shared';
import { CONTRACT_KEY } from './route.js';
@Injectable()
export class InputInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const route = this.reflector.get<RouteDescriptor>(CONTRACT_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest<Request & { routeInput?: unknown }>();
    request.routeInput = { params: route?.params?.parse(request.params), query: route?.query?.parse(request.query), body: route?.body?.parse(request.body) };
    return next.handle();
  }
}
