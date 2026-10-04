import { Controller, Inject } from '@nestjs/common';
import {
  listAllergens, createAllergen, updateAllergen,
  listDietaryTags, createDietaryTag, updateDietaryTag,
  listKitchenStations, createKitchenStation, updateKitchenStation,
  type InputOf,
} from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { ReferenceService } from './reference.service.js';

@Controller()
export class ReferenceController {
  constructor(@Inject(ReferenceService) private readonly service: ReferenceService) {}

  @Route(listAllergens) listAllergens(@Input() input: InputOf<typeof listAllergens>) { return this.service.list('allergen', input.query); }
  @Route(createAllergen) createAllergen(@Input() input: InputOf<typeof createAllergen>) { return this.service.create('allergen', input.body); }
  @Route(updateAllergen) updateAllergen(@Input() input: InputOf<typeof updateAllergen>) { return this.service.update('allergen', input.params.id, input.body); }
  @Route(listDietaryTags) listDietaryTags(@Input() input: InputOf<typeof listDietaryTags>) { return this.service.list('dietaryTag', input.query); }
  @Route(createDietaryTag) createDietaryTag(@Input() input: InputOf<typeof createDietaryTag>) { return this.service.create('dietaryTag', input.body); }
  @Route(updateDietaryTag) updateDietaryTag(@Input() input: InputOf<typeof updateDietaryTag>) { return this.service.update('dietaryTag', input.params.id, input.body); }
  @Route(listKitchenStations) listKitchenStations(@Input() input: InputOf<typeof listKitchenStations>) { return this.service.list('kitchenStation', input.query); }
  @Route(createKitchenStation) createKitchenStation(@Input() input: InputOf<typeof createKitchenStation>) { return this.service.create('kitchenStation', input.body); }
  @Route(updateKitchenStation) updateKitchenStation(@Input() input: InputOf<typeof updateKitchenStation>) { return this.service.update('kitchenStation', input.params.id, input.body); }
}
