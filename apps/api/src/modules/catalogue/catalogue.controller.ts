import { Controller } from '@nestjs/common';
import {
  listDishes,
  getDish,
  createDish,
  updateDish,
  listOptions,
  createOption,
  updateOption,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@fernleaf/shared';
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class CatalogueController {
  @Route(listDishes) listDishes(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.listDishes is not implemented',
      501,
    );
  }
  @Route(getDish) getDish(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.getDish is not implemented',
      501,
    );
  }
  @Route(createDish) createDish(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.createDish is not implemented',
      501,
    );
  }
  @Route(updateDish) updateDish(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.updateDish is not implemented',
      501,
    );
  }
  @Route(listOptions) listOptions(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.listOptions is not implemented',
      501,
    );
  }
  @Route(createOption) createOption(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.createOption is not implemented',
      501,
    );
  }
  @Route(updateOption) updateOption(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.updateOption is not implemented',
      501,
    );
  }
  @Route(listGroups) listGroups(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.listGroups is not implemented',
      501,
    );
  }
  @Route(createGroup) createGroup(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.createGroup is not implemented',
      501,
    );
  }
  @Route(updateGroup) updateGroup(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.updateGroup is not implemented',
      501,
    );
  }
  @Route(deleteGroup) deleteGroup(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'catalogue.deleteGroup is not implemented',
      501,
    );
  }
}
