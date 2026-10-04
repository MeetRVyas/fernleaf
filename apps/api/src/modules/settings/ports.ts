import {
  settingDefaults,
  settingValueSchemas,
  type SettingKey,
} from '@fernleaf/shared';
import { stringToDbDate } from '@fernleaf/shared';
import type { z } from 'zod';
export type Settings = {
  [K in SettingKey]: z.infer<(typeof settingValueSchemas)[K]>;
};
export interface SettingsPort {
  get(): Promise<Settings>;
  isKitchenWorkingDay(date: string): Promise<boolean>;
}
export const SETTINGS_PORT = Symbol('SettingsPort');
export class StubSettingsPort implements SettingsPort {
  async get(): Promise<Settings> {
    return {
      ...settingDefaults,
      'kitchen.workingDays': [...settingDefaults['kitchen.workingDays']],
    };
  }
  async isKitchenWorkingDay(date: string): Promise<boolean> {
    const weekday = stringToDbDate(date).getUTCDay() || 7;
    return settingDefaults['kitchen.workingDays'].includes(weekday as 1);
  }
}
