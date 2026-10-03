import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { TxRunner } from './tx-runner.js';
import { Clock } from './clock.js';
import { HookBus } from './hook-bus.js';
import { SettingsCache } from './settings-cache.js';
@Global()
@Module({ providers: [PrismaService, TxRunner, Clock, HookBus, SettingsCache], exports: [PrismaService, TxRunner, Clock, HookBus, SettingsCache] })
export class CoreModule {}
