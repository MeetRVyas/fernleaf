import { afterAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../core/prisma.service.js';
import { TxRunner } from '../../core/tx-runner.js';
import { SettingsCache } from '../../core/settings-cache.js';
import { SettingsRepository } from './settings.repository.js';
import { SettingsService } from './settings.service.js';
import { holiday, listSettings, settingRecord } from '@fernleaf/shared';

const db = new PrismaService();
const service = new SettingsService(new SettingsRepository(db), new TxRunner(db), new SettingsCache());
afterAll(async () => { await db.kitchenHoliday.deleteMany({ where: { name: 'Settings test' } }); await db.setting.deleteMany({ where: { key: 'cutoff.time' } }); await db.onModuleDestroy(); });

describe('settings database port and routes', () => {
  it('conforms to the list response and updates a value', async () => {
    expect(listSettings.response.parse(await service.list())).toHaveLength(8);
    const changed = await service.update('cutoff.time', '15:45');
    expect(settingRecord.parse(changed).value).toBe('15:45');
    expect((await service.get())['cutoff.time']).toBe('15:45');
    expect((await db.setting.findUniqueOrThrow({ where: { key: 'cutoff.time' } })).value).toBe('"15:45"');
  });
  it('rejects duplicate holiday dates and removes them', async () => {
    const created = holiday.parse(await service.createHoliday('2031-10-06', 'Settings test'));
    expect(await service.isKitchenWorkingDay('2031-10-06')).toBe(false);
    await expect(service.createHoliday('2031-10-06', 'Again')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await service.deleteHoliday(created.id)).toEqual({ ok: true });
  });
});
