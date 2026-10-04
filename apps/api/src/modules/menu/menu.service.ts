import { Inject, Injectable } from '@nestjs/common';
import { MenuRepository } from './menu.repository.js';
@Injectable()
export class MenuService {
  constructor(
    @Inject(MenuRepository) private readonly repository: MenuRepository,
  ) {}
}
