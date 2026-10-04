import { Module } from '@nestjs/common';
import { SETTINGS_PORT } from './ports.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { SettingsRepository } from './settings.repository.js';
@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    SettingsRepository,
    { provide: SETTINGS_PORT, useExisting: SettingsService },
  ],
  exports: [SETTINGS_PORT],
})
export class SettingsModule {}
