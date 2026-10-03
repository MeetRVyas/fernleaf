import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { CONTRACT_KEY } from './route.js';
@Injectable()
export class ContractAudit implements OnApplicationBootstrap {
  constructor(@Inject(DiscoveryService) private readonly discovery: DiscoveryService, @Inject(Reflector) private readonly reflector: Reflector) {}
  onApplicationBootstrap(): void {
    for (const wrapper of this.discovery.getControllers()) {
      const instance: unknown = wrapper.instance;
      if (!instance || typeof instance !== 'object') continue;
      const prototype: object = Object.getPrototypeOf(instance) as object;
      for (const name of Object.getOwnPropertyNames(prototype)) {
        if (name === 'constructor') continue;
        const handler: unknown = Reflect.get(prototype, name);
        if (typeof handler === 'function' && !this.reflector.get(CONTRACT_KEY, handler)) throw new Error(`Route ${wrapper.name}.${name} has no contract`);
      }
    }
  }
}
