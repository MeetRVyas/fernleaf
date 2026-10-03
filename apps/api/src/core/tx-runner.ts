import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
export type Tx = Prisma.TransactionClient;
@Injectable()
export class TxRunner {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  run<T>(work: (tx: Tx) => Promise<T>): Promise<T> { return this.db.$transaction(work); }
}
