import type { ReferenceKind } from './reference.repository.js';

export interface ReferencePort {
  existingIds(kind: ReferenceKind, ids: string[]): Promise<string[]>;
}

export const REFERENCE_PORT = Symbol('ReferencePort');
