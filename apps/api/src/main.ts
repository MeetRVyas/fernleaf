import './instrument.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module.js';
import { env } from './core/config.js';
import { logger } from './core/logger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set('trust proxy', env.TRUST_PROXY === 'true');
  app.use(cookieParser());
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
