import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module.js';
import { env } from './core/config.js';
import * as Sentry from '@sentry/node';

async function bootstrap(): Promise<void> {
  if (env.SENTRY_DSN) Sentry.init({ dsn: env.SENTRY_DSN });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set('trust proxy', env.TRUST_PROXY === 'true');
  app.use(cookieParser());
  const logger = pino({ redact: ['req.headers.cookie', 'password', 'token'] });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = request.header('x-request-id') ?? randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => logger.info({ requestId, method: request.method, path: request.path, status: response.statusCode }, 'request'));
    next();
  });
  await app.listen(env.PORT);
}
void bootstrap();
