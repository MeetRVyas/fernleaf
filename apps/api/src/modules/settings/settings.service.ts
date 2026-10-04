import { Inject, Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository.js';
@Injectable()
export class SettingsService {
  constructor(
    @Inject(SettingsRepository) private readonly repository: SettingsRepository,
  ) {}
}
