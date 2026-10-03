# TypeScript patterns used in the platform

The compiler uses `strict: true`: a value can be used only after its type is known. Route input and output types come from zod schemas. For example, `staffPublic` describes a staff response and `z.infer<typeof staffPublic>` is the matching TypeScript type. The route descriptor keeps method, path, permission, input schemas, and output schema together.

`as const` preserves exact string values: `ROLES` becomes a tuple of four role names rather than a general `string[]`. `Role = (typeof ROLES)[number]` means one of those names. The `can(user, permission)` helper checks the role registry; other code should never compare role names.

`unknown` means a value has not been checked. The typed client reads JSON as `unknown`, then `route.response.parse(json)` validates it before returning it. An exception filter also narrows caught errors with `instanceof` before reading properties.

`InputOf<typeof login>` derives a handler's input from its contract. `@Input()` provides the request data after the global interceptor validates it. This keeps controller methods small and prevents a handwritten DTO from drifting away from the shared contract.

`TxRunner.run(async tx => ...)` passes one Prisma transaction client into a use case. A repository can use that `tx` for all writes, so an exception rolls the entire operation back. `HookBus.emit(tx, event, payload)` awaits subscribers in the same transaction.

ESM imports use `.js` in source paths such as `import { Clock } from './clock.js'`. TypeScript resolves the `.ts` source when checking and leaves a valid `.js` path in emitted code.
