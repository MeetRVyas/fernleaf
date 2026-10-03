import { Injectable } from '@nestjs/common';
import type { Tx } from './tx-runner.js';
type Handler = (tx: Tx, payload: unknown) => Promise<void>;
@Injectable()
export class HookBus {
  private readonly listeners = new Map<string, Handler[]>();
  on(event: string, handler: Handler): void { this.listeners.set(event, [...(this.listeners.get(event) ?? []), handler]); }
  async emit(tx: Tx, event: string, payload: unknown): Promise<void> { for (const handler of this.listeners.get(event) ?? []) await handler(tx, payload); }
}
