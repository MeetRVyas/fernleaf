import { z } from 'zod';

export const dishSnapshot = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  temperature: z.enum(['HOT', 'COLD']),
  allergens: z.array(z.string()),
});
export const optionsSnapshot = z.array(
  z.object({
    groupId: z.uuid(),
    groupName: z.string(),
    optionId: z.uuid(),
    name: z.string(),
    priceCents: z.number().int().nonnegative(),
  }),
);
export const addressSnapshot = z.object({
  label: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
});
export const eventMeta = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);
