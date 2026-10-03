import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from './api-error.js';
import { ERROR_HTTP_STATUS, type ErrorCode } from '@fernleaf/shared';
import * as Sentry from '@sentry/node';
import { env } from './config.js';
import { logger } from './logger.js';
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = request.header('x-request-id') ?? 'unknown';
    const report = (status: number): void => {
      if (status < 500) return;
      logger.error({ requestId, err: error }, 'request failed');
      if (env.SENTRY_DSN) Sentry.withScope(scope => { scope.setTag('requestId', requestId); Sentry.captureException(error); });
    };
    if (error instanceof ZodError) {
      response.status(422).json({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: Object.fromEntries(error.issues.map(issue => [issue.path.join('.'), issue.message])), requestId });
      return;
    }
    if (error instanceof ApiError) { const status = ERROR_HTTP_STATUS[error.code]; report(status); response.status(status).json({ code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), requestId }); return; }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') { response.status(409).json({ code: 'CONFLICT', message: 'A unique value already exists', requestId }); return; }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') { response.status(404).json({ code: 'NOT_FOUND', message: 'Record not found', requestId }); return; }
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const code: ErrorCode = ({ 400: 'MALFORMED_JSON', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION_ERROR', 429: 'THROTTLED' } as Record<number, ErrorCode>)[status] ?? 'INTERNAL_ERROR';
    report(status);
    response.status(status).json({ code, message: status === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Request failed', requestId });
  }
}
