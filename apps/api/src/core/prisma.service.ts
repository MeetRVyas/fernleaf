import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './config.js';
import { logger } from './logger.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly pool: Pool;
  constructor() {
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
    pool.on('error', (error) => { logger.error({ requestId: 'system', error: error.message }, 'Postgres idle connection error'); });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }
  async onModuleDestroy(): Promise<void> { await this.$disconnect(); await this.pool.end(); }
}
