import { Controller } from '@nestjs/common';
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
import { Route } from '../../core/route.js';
import { ApiError } from '../../core/api-error.js';
@Controller()
export class MenuController {
  @Route(listCategories) listCategories(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.listCategories is not implemented',
      501,
    );
  }
  @Route(createCategory) createCategory(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.createCategory is not implemented',
      501,
    );
  }
  @Route(updateCategory) updateCategory(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.updateCategory is not implemented',
      501,
    );
  }
  @Route(createMenuItem) createMenuItem(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.createMenuItem is not implemented',
      501,
    );
  }
  @Route(updateMenuItem) updateMenuItem(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.updateMenuItem is not implemented',
      501,
    );
  }
  @Route(setCompanyMenuHiding) setCompanyMenuHiding(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.setCompanyMenuHiding is not implemented',
      501,
    );
  }
  @Route(previewMenu) previewMenu(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.previewMenu is not implemented',
      501,
    );
  }
  @Route(previewSecretCategory) previewSecretCategory(): never {
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'menu.previewSecretCategory is not implemented',
      501,
    );
  }
}
