import { Controller } from '@nestjs/common';
import {
  listAllergens,
  createAllergen,
  updateAllergen,
  listDietaryTags,
  createDietaryTag,
  updateDietaryTag,
  listKitchenStations,
  createKitchenStation,
  updateKitchenStation,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class ReferenceController {
  @Route(listAllergens) listAllergens(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.listAllergens is not implemented',
      501,
    );
  }
  @Route(createAllergen) createAllergen(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.createAllergen is not implemented',
      501,
    );
  }
  @Route(updateAllergen) updateAllergen(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.updateAllergen is not implemented',
      501,
    );
  }
  @Route(listDietaryTags) listDietaryTags(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.listDietaryTags is not implemented',
      501,
    );
  }
  @Route(createDietaryTag) createDietaryTag(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.createDietaryTag is not implemented',
      501,
    );
  }
  @Route(updateDietaryTag) updateDietaryTag(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.updateDietaryTag is not implemented',
      501,
    );
  }
  @Route(listKitchenStations) listKitchenStations(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.listKitchenStations is not implemented',
      501,
    );
  }
  @Route(createKitchenStation) createKitchenStation(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.createKitchenStation is not implemented',
      501,
    );
  }
  @Route(updateKitchenStation) updateKitchenStation(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'reference.updateKitchenStation is not implemented',
      501,
    );
  }
}
