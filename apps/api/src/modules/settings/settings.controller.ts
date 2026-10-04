import { Controller, Inject } from '@nestjs/common';
import { listSettings, updateSetting, listKitchenHolidays, createKitchenHoliday, deleteKitchenHoliday, type InputOf } from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { SettingsService } from './settings.service.js';
@Controller()
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly service: SettingsService) {}
  @Route(listSettings) listSettings() { return this.service.list(); }
  @Route(updateSetting) updateSetting(@Input() input: InputOf<typeof updateSetting>) { return this.service.update(input.params.key, input.body.value); }
  @Route(listKitchenHolidays) listKitchenHolidays() { return this.service.listHolidays(); }
  @Route(createKitchenHoliday) createKitchenHoliday(@Input() input: InputOf<typeof createKitchenHoliday>) { return this.service.createHoliday(input.body.date, input.body.name); }
  @Route(deleteKitchenHoliday) deleteKitchenHoliday(@Input() input: InputOf<typeof deleteKitchenHoliday>) { return this.service.deleteHoliday(input.params.id); }
}
