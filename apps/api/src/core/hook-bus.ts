import { Injectable } from '@nestjs/common';
import type { Tx } from './tx-runner.js';
type Handler = (tx: Tx, payload: unknown) => Promise<void>;
@Injectable()
export class HookBus<Events extends Record<string, unknown> = Record<string, unknown>> {
  private readonly listeners = new Map<string, Handler[]>();
  on<K extends keyof Events & string>(event: K, handler: (tx: Tx, payload: Events[K]) => Promise<void>): void {
    // The wrapper keeps the public event/payload pair typed while storage stays uniform.
    const wrapped: Handler = (tx, payload) => handler(tx, payload as Events[K]);
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), wrapped]);
  }
  async emit<K extends keyof Events & string>(tx: Tx, event: K, payload: Events[K]): Promise<void> { for (const handler of this.listeners.get(event) ?? []) await handler(tx, payload); }
}
