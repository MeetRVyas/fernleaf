import { Inject, Injectable } from '@nestjs/common';
import { DispatchRepository } from './dispatch.repository.js';
@Injectable()
export class DispatchService {
  constructor(
    @Inject(DispatchRepository) private readonly repository: DispatchRepository,
  ) {}
}
