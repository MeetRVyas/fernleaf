import { Controller, Inject } from '@nestjs/common';
import {
  listCategories,
  createCategory,
  updateCategory,
  createMenuItem,
  updateMenuItem,
  setCompanyMenuHiding,
  previewMenu,
  previewSecretCategory,
} from '@fernleaf/shared';
import { Route, Input, type ContractInput } from '../../core/route.js';
import { MenuService } from './menu.service.js';
@Controller()
export class MenuController {
  constructor(@Inject(MenuService) private readonly service: MenuService) {}
  @Route(listCategories) listCategories() {
    return this.service.listCategories();
  }
  @Route(createCategory) createCategory(
    @Input() input: ContractInput<typeof createCategory>,
  ) {
    return this.service.createCategory(input.body);
  }
  @Route(updateCategory) updateCategory(
    @Input() input: ContractInput<typeof updateCategory>,
  ) {
    return this.service.updateCategory(input.params.id, input.body);
  }
  @Route(createMenuItem) createMenuItem(
    @Input() input: ContractInput<typeof createMenuItem>,
  ) {
    return this.service.createItem(input.body);
  }
  @Route(updateMenuItem) updateMenuItem(
    @Input() input: ContractInput<typeof updateMenuItem>,
  ) {
    return this.service.updateItem(input.params.id, input.body);
  }
  @Route(setCompanyMenuHiding) setCompanyMenuHiding(
    @Input() input: ContractInput<typeof setCompanyMenuHiding>,
  ) {
    return this.service.setHiding(
      input.params.id,
      input.body.hiddenCategoryIds,
      input.body.hiddenItemIds,
    );
  }
  @Route(previewMenu) previewMenu(
    @Input() input: ContractInput<typeof previewMenu>,
  ) {
    return this.service.getMenuFor(input.params.id);
  }
  @Route(previewSecretCategory) previewSecretCategory(
    @Input() input: ContractInput<typeof previewSecretCategory>,
  ) {
    return this.service.previewCategory(
      input.params.id,
      input.params.categoryId,
    );
  }
}
