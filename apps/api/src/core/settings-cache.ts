import { Injectable } from '@nestjs/common';
@Injectable()
export class SettingsCache {
  private readonly cache = new Map<string, unknown>();
  get(key: string): unknown { return this.cache.get(key); }
  set(key: string, value: unknown): void { this.cache.set(key, value); }
  invalidate(key?: string): void { if (key) this.cache.delete(key); else this.cache.clear(); }
}
