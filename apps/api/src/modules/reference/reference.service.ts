import { Inject, Injectable } from '@nestjs/common';
import { ReferenceRepository } from './reference.repository.js';
@Injectable()
export class ReferenceService {
  constructor(
    @Inject(ReferenceRepository)
    private readonly repository: ReferenceRepository,
  ) {}
}
