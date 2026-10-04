# Schema requests

No schema change is requested by Session B2. Shared contracts and module shells use the existing `schema.prisma` and migrations. Feature sessions should record any necessary change here for the schema owner to implement with Prisma Migrate.

## Session 3A: Reference active status

The `referenceItem` contract requires `isActive` and both create and update accept it, but `Allergen`, `DietaryTag`, and `KitchenStation` have no `isActive` columns. Add non-null Boolean `isActive` fields, defaulting to true, to all three models in a new Prisma migration. Until merged, the Reference API can list/create/rename active entries, but rejects deactivation instead of falsely reporting it as saved.
