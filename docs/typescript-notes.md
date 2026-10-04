# TypeScript patterns used in the platform

The compiler uses `strict: true`: a value can be used only after its type is known. Route input and output types come from zod schemas. For example, `staffPublic` describes a staff response and `z.infer<typeof staffPublic>` is the matching TypeScript type. The route descriptor keeps method, path, permission, input schemas, and output schema together.

`as const` preserves exact string values: `ROLES` becomes a tuple of four role names rather than a general `string[]`. `Role = (typeof ROLES)[number]` means one of those names. The `can(user, permission)` helper checks the role registry; other code should never compare role names.

`unknown` means a value has not been checked. The typed client reads JSON as `unknown`, then `route.response.parse(json)` validates it before returning it. An exception filter also narrows caught errors with `instanceof` before reading properties.

`InputOf<typeof login>` derives a handler's input from its contract. `@Input()` provides the request data after the global interceptor validates it. This keeps controller methods small and prevents a handwritten DTO from drifting away from the shared contract.

`TxRunner.run(async tx => ...)` passes one Prisma transaction client into a use case. A repository can use that `tx` for all writes, so an exception rolls the entire operation back. `HookBus.emit(tx, event, payload)` awaits subscribers in the same transaction.

ESM imports use `.js` in source paths such as `import { Clock } from './clock.js'`. TypeScript resolves the `.ts` source when checking and leaves a valid `.js` path in emitted code.

Nest constructor parameters use explicit `@Inject(Service)` decorators. The fast `tsx` and Vitest transpilers do not emit TypeScript's constructor metadata, so the explicit token tells Nest what to provide in both development and tests. For example, `constructor(@Inject(Clock) private readonly clock: Clock) {}` asks Nest for the shared clock.

The database tests use Vitest `globalSetup` to create a uniquely named template database and apply committed migrations once. A setup file clones the template for each worker and sets `DATABASE_URL` to that clone. The global teardown drops all databases created for the run.

`HookBus<Events>` is generic: each event name selects its payload type. A module can define an event map such as `{ 'order.confirmed': { orderId: string } }` and use `HookBus<ThatMap>`. The internal wrapper stores handlers together while preserving that pair at every public `on` and `emit` call.

Permission files export a permission object and role grants. `roles.ts` gathers them into `PERM` and `ROLE_PERMISSIONS`; adding a role grant in a module does not require editing the central role map. `as const` keeps each permission string exact. A mapped type gathers those strings into `Permission`, so a route cannot use an unknown permission.

For list filters with multiple values, the typed client repeats the query key (`status=PLACED&status=CONFIRMED`). `arrayQueryParam` accepts either one string or an array from Express and produces an array in the validated route input. The same contract handles both a single selection and several selections.

A stub port keeps the same method parameters as the real adapter. When a no-op stub does not use a parameter, `void parameter` explicitly marks that it was intentionally ignored so lint can still catch accidental unused variables elsewhere. The stub's return is fixed fixture data; business logic must replace the stub before the feature is accepted.

## React and TypeScript in the web app

React components return JSX. A `.tsx` file lets TypeScript check both JavaScript expressions and component props. `RootLayout({ children }: { children: ReactNode })` says the layout accepts any React content as its child. A client component starts with `'use client'` when it uses hooks, browser events, or a provider; route files can remain thin server components.

`useQuery` holds server data and its loading/error states. `useMutation` represents a command such as login. The auth hook calls `api.call(me)` using the shared route descriptor; its result type is inferred from the contract response. The query key `['auth', 'me']` lets login refresh the cached session.

`TableColumn<T>` is generic: the same table can render staff, orders, or other rows while `render(row: T)` keeps each column type-safe. `useTableState` reads URL parameters so a copied list URL restores its page, sort, and filters. `Record<string, string>` means an object whose keys and values are strings, used for filter names and values.

`zod4Resolver(login.body)` connects the shared Zod 4 schema to Mantine's form validation. On an API failure, `showApiError` checks an `unknown` value before reading its `details` and assigning messages to fields. The response can be malformed, so code cannot safely treat a caught error as a known type without checking it first.
