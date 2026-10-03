import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from './api-error.js';
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = request.header('x-request-id') ?? 'unknown';
    if (error instanceof ZodError) {
      response.status(422).json({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: Object.fromEntries(error.issues.map(issue => [issue.path.join('.'), issue.message])), requestId });
      return;
    }
    if (error instanceof ApiError) { response.status(error.getStatus()).json({ code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), requestId }); return; }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') { response.status(409).json({ code: 'CONFLICT', message: 'A unique value already exists', requestId }); return; }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') { response.status(404).json({ code: 'NOT_FOUND', message: 'Record not found', requestId }); return; }
    const status = error instanceof HttpException ? error.getStatus() : 500;
    response.status(status).json({ code: status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Request failed', requestId });
  }
}
