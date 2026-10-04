import { buildClient } from '@fernleaf/shared';

// The shared builder supplies contract input and response types at each call site.
export const api = buildClient('/api');
