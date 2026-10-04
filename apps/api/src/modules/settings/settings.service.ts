import { Inject, Injectable } from '@nestjs/common';
import {
  dbDateToString,
  encodeSettingValue,
  parseSettingValue,
  settingDefaults,
  settingValueSchemas,
  stringToDbDate,
  type SettingKey,
} from '@fernleaf/shared';
import { SettingsCache } from '../../core/settings-cache.js';
import { TxRunner } from '../../core/tx-runner.js';
import { ApiError } from '../../core/api-error.js';
import { SettingsRepository } from './settings.repository.js';
import type { Settings, SettingsPort } from './ports.js';

const keys = Object.keys(settingDefaults) as SettingKey[];
@Injectable()
export class SettingsService implements SettingsPort {
  constructor(
    @Inject(SettingsRepository) private readonly repository: SettingsRepository,
    @Inject(TxRunner) private readonly txRunner: TxRunner,
    @Inject(SettingsCache) private readonly cache: SettingsCache,
  ) {}
  async get(): Promise<Settings> {
    const cached = this.cache.get('settings');
    if (cached) return cached as Settings;
    const values: Settings = {
      ...settingDefaults,
      'kitchen.workingDays': [...settingDefaults['kitchen.workingDays']],
    };
    for (const row of await this.repository.list()) {
      if (keys.includes(row.key as SettingKey)) {
        const key = row.key as SettingKey;
        Object.assign(values, { [key]: parseSettingValue(key, row.value) });
      }
    }
    this.cache.set('settings', values);
    return values;
  }
  async list() {
    const rows = await this.repository.list();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return keys.map((key) => ({
      key,
      value: byKey.has(key)
        ? parseSettingValue(key, byKey.get(key)!.value)
        : settingDefaults[key],
      updatedAt: (byKey.get(key)?.updatedAt ?? new Date(0)).toISOString(),
    }));
  }
  async update(key: SettingKey, value: string | number | boolean | number[]) {
    const parsed = settingValueSchemas[key].safeParse(value);
    if (!parsed.success)
      throw new ApiError('VALIDATION_ERROR', 'Invalid setting value', 422, {
        value: parsed.error.issues[0]?.message ?? 'Invalid value',
      });
    const row = await this.txRunner.run((tx) =>
      this.repository.put(tx, key, encodeSettingValue(key, parsed.data)),
    );
    this.cache.invalidate('settings');
    return {
      key,
      value: parseSettingValue(key, row.value),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  async isKitchenWorkingDay(date: string): Promise<boolean> {
    const weekday = stringToDbDate(date).getUTCDay() || 7;
    const values = await this.get();
    if (!values['kitchen.workingDays'].includes(weekday)) return false;
    return !(await this.repository.holidayOn(stringToDbDate(date)));
  }
  async listHolidays() {
    return (await this.repository.holidays()).map((row) => ({
      id: row.id,
      date: dbDateToString(row.date),
      name: row.name,
    }));
  }
  async createHoliday(date: string, name: string) {
    let row;
    try {
      row = await this.txRunner.run(async (tx) => {
        if (await this.repository.holidayOn(stringToDbDate(date), tx))
          throw new ApiError('CONFLICT', 'Holiday already exists', 409);
        return this.repository.createHoliday(tx, stringToDbDate(date), name);
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      )
        throw new ApiError('CONFLICT', 'Holiday already exists', 409);
      throw error;
    }
    return { id: row.id, date: dbDateToString(row.date), name: row.name };
  }
  async deleteHoliday(id: string) {
    const deleted = await this.txRunner.run((tx) =>
      this.repository.deleteHoliday(tx, id),
    );
    if (!deleted.count)
      throw new ApiError('NOT_FOUND', 'Holiday not found', 404);
    return { ok: true as const };
  }
}
