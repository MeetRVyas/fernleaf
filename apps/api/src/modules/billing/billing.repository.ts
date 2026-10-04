import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
@Injectable()
export class BillingRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
}
