import { Injectable } from '@nestjs/common';
import { kitchenToday } from '@fernleaf/shared';
import { env } from './config.js';
@Injectable()
export class Clock {
  now(): Date { return new Date(); }
  today(): string { return kitchenToday(this.now(), env.KITCHEN_TIMEZONE); }
}
