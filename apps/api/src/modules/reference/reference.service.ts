import { Inject, Injectable } from '@nestjs/common';
import { ReferenceRepository } from './reference.repository.js';
import type { ReferenceKind } from './reference.repository.js';
import { TxRunner } from '../../core/tx-runner.js';
import { ApiError } from '../../core/api-error.js';
import { normalizeName } from './domain/normalize-name.js';
@Injectable()
export class ReferenceService {
  constructor(
    @Inject(ReferenceRepository)
    private readonly repository: ReferenceRepository,
    @Inject(TxRunner) private readonly txRunner: TxRunner,
  ) {}

  async list(kind: ReferenceKind, query: { page: number; pageSize: number; sort?: string }) {
    const sort = query.sort ?? 'name:asc';
    if (sort !== 'name:asc' && sort !== 'name:desc') throw new ApiError('VALIDATION_ERROR', 'Unsupported sort', 422);
    const [items, total] = await Promise.all([
      this.repository.list(kind, (query.page - 1) * query.pageSize, query.pageSize, sort.endsWith('desc') ? 'desc' : 'asc'),
      this.repository.count(kind),
    ]);
    return { items: items.map(item => ({ id: item.id, name: item.name, isActive: true })), total, page: query.page, pageSize: query.pageSize };
  }

  async create(kind: ReferenceKind, body: { name: string; isActive: boolean }) {
    const name = normalizeName(body.name);
    this.validate(name, body.isActive);
    return this.txRunner.run(async tx => {
      if (await this.repository.findByName(tx, kind, name)) throw new ApiError('CONFLICT', 'Name already exists', 409);
      try {
        const item = await this.repository.create(tx, kind, name);
        return { id: item.id, name: item.name, isActive: true };
      } catch (error: unknown) {
        if (this.isUniqueError(error)) throw new ApiError('CONFLICT', 'Name already exists', 409);
        throw error;
      }
    });
  }

  async update(kind: ReferenceKind, id: string, body: { name?: string; isActive?: boolean }) {
    const name = body.name === undefined ? undefined : normalizeName(body.name);
    if (name !== undefined || body.isActive !== undefined) this.validate(name, body.isActive);
    return this.txRunner.run(async tx => {
      const current = await this.repository.find(tx, kind, id);
      if (!current) throw new ApiError('NOT_FOUND', 'Reference item not found', 404);
      if (name === undefined || name === current.name) return { id: current.id, name: current.name, isActive: true };
      const duplicate = await this.repository.findByName(tx, kind, name);
      if (duplicate && duplicate.id !== id) throw new ApiError('CONFLICT', 'Name already exists', 409);
      try {
        const item = await this.repository.update(tx, kind, id, name);
        return { id: item.id, name: item.name, isActive: true };
      } catch (error: unknown) {
        if (this.isUniqueError(error)) throw new ApiError('CONFLICT', 'Name already exists', 409);
        throw error;
      }
    });
  }

  private validate(name?: string, isActive?: boolean) {
    if (name !== undefined && name.length === 0) throw new ApiError('VALIDATION_ERROR', 'Name is required', 422, { name: 'Name is required' });
    if (isActive === false) throw new ApiError('VALIDATION_ERROR', 'Reference deactivation needs the requested schema change', 422, { isActive: 'Deactivation is not available yet' });
  }

  private isUniqueError(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
