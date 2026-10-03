import pino from 'pino';
export const logger = pino({ redact: ['req.headers.cookie', 'password', 'token'] });
