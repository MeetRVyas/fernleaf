import * as Sentry from '@sentry/node';
import { env } from './core/config.js';

if (env.SENTRY_DSN) Sentry.init({ dsn: env.SENTRY_DSN });
