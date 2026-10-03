import { applyDecorators, Delete, Get, Patch, Post, Put, HttpCode, SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RouteDescriptor, InputOf } from '@fernleaf/shared';
export const CONTRACT_KEY = 'fernleaf:contract';
export function Route<T extends RouteDescriptor>(contract: T): MethodDecorator {
  const method = { GET: Get, POST: Post, PATCH: Patch, PUT: Put, DELETE: Delete }[contract.method];
  return applyDecorators(method(contract.path), HttpCode(contract.method === 'POST' && contract.id.endsWith('.create') ? 201 : 200), SetMetadata(CONTRACT_KEY, contract));
}
export const Input = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { routeInput?: unknown }>();
  return request.routeInput;
});
export type ContractInput<T extends RouteDescriptor> = InputOf<T>;
