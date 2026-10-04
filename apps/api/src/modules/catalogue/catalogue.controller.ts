import { Controller, Inject } from '@nestjs/common';
import {
  listDishes, getDish, createDish, updateDish,
  listOptions, createOption, updateOption,
  listGroups, createGroup, updateGroup, deleteGroup,
  type InputOf,
} from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { CatalogueService } from './catalogue.service.js';

@Controller()
export class CatalogueController {
  constructor(@Inject(CatalogueService) private readonly service: CatalogueService) {}
  @Route(listDishes) listDishes(@Input() input: InputOf<typeof listDishes>) { return this.service.listDishes(input.query); }
  @Route(getDish) getDish(@Input() input: InputOf<typeof getDish>) { return this.service.dishDetail(input.params.id); }
  @Route(createDish) createDish(@Input() input: InputOf<typeof createDish>) { return this.service.createDish(input.body); }
  @Route(updateDish) updateDish(@Input() input: InputOf<typeof updateDish>) { return this.service.updateDish(input.params.id, input.body); }
  @Route(listOptions) listOptions(@Input() input: InputOf<typeof listOptions>) { return this.service.listOptions(input.query); }
  @Route(createOption) createOption(@Input() input: InputOf<typeof createOption>) { return this.service.createOption(input.body); }
  @Route(updateOption) updateOption(@Input() input: InputOf<typeof updateOption>) { return this.service.updateOption(input.params.id, input.body); }
  @Route(listGroups) listGroups(@Input() input: InputOf<typeof listGroups>) { return this.service.listGroups(input.params.id); }
  @Route(createGroup) createGroup(@Input() input: InputOf<typeof createGroup>) { return this.service.createGroup(input.params.id, input.body); }
  @Route(updateGroup) updateGroup(@Input() input: InputOf<typeof updateGroup>) { return this.service.updateGroup(input.params.id, input.body); }
  @Route(deleteGroup) deleteGroup(@Input() input: InputOf<typeof deleteGroup>) { return this.service.deleteGroup(input.params.id); }
}
