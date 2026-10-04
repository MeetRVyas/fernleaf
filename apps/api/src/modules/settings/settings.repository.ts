import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service.js';
import type { Tx } from '../../core/tx-runner.js';

@Injectable()
export class SettingsRepository {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  list(tx?: Tx) { return (tx ?? this.db).setting.findMany(); }
  put(tx: Tx, key: string, value: string) { return tx.setting.upsert({ where: { key }, create: { key, value }, update: { value } }); }
  holidays(tx?: Tx) { return (tx ?? this.db).kitchenHoliday.findMany({ orderBy: { date: 'asc' } }); }
  holidayOn(date: Date, tx?: Tx) { return (tx ?? this.db).kitchenHoliday.findUnique({ where: { date } }); }
  createHoliday(tx: Tx, date: Date, name: string) { return tx.kitchenHoliday.create({ data: { date, name } }); }
  deleteHoliday(tx: Tx, id: string) { return tx.kitchenHoliday.deleteMany({ where: { id } }); }
}
