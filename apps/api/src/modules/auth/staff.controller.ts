import { Controller, Inject, Req } from '@nestjs/common';
import type { Request } from 'express';
import { listStaff, createStaff, changeRole, deactivateStaff, resetStaffPassword, type InputOf } from '@fernleaf/shared';
import { Route, Input } from '../../core/route.js';
import { AuthService } from './auth.service.js';
@Controller()
export class StaffController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}
  @Route(listStaff) list(@Input() input: InputOf<typeof listStaff>) { return this.service.list(input.query.page, input.query.pageSize); }
  @Route(createStaff) create(@Input() input: InputOf<typeof createStaff>) { return this.service.create(input.body); }
  @Route(changeRole) role(@Input() input: InputOf<typeof changeRole>, @Req() request: Request & { user?: { id: string } }) { return this.service.changeRole(request.user!.id, input.params.id, input.body.role); }
  @Route(deactivateStaff) deactivate(@Input() input: InputOf<typeof deactivateStaff>, @Req() request: Request & { user?: { id: string } }) { return this.service.deactivate(request.user!.id, input.params.id); }
  @Route(resetStaffPassword) resetPassword(@Input() input: InputOf<typeof resetStaffPassword>) { return this.service.resetPassword(input.params.id, input.body.password); }
}
