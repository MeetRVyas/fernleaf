import { z } from 'zod';
export const paginationQuery = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25), sort: z.string().optional() });
export function pageResponse<T extends z.ZodType>(item: T) { return z.object({ items: z.array(item), total: z.number().int().min(0), page: z.number().int().min(1), pageSize: z.number().int().min(1).max(100) }); }
