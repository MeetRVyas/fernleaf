import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly pool: Pool;
  constructor() {
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
    pool.on('error', (error) => { process.stderr.write(`Postgres idle connection error: ${error.message}\n`); });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }
  async onModuleDestroy(): Promise<void> { await this.$disconnect(); await this.pool.end(); }
}
