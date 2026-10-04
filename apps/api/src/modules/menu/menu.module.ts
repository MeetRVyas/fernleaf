import { Module } from '@nestjs/common';
import { MENU_PORT, StubMenuPort } from './ports.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { MenuRepository } from './menu.repository.js';
@Module({
  controllers: [MenuController],
  providers: [
    MenuService,
    MenuRepository,
    { provide: MENU_PORT, useClass: StubMenuPort },
  ],
  exports: [MENU_PORT],
})
export class MenuModule {}
