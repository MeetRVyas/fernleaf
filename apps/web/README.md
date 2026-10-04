# Fernleaf web foundation

Next.js App Router UI. The browser calls the Nest API only through the same-origin `/api/*` rewrite. API business rules and authorization stay in Nest. The route descriptors in `@fernleaf/shared` define request and response shapes.

## Environment

| Variable | Example | Purpose |
|---|---|---|
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` | Server-side rewrite target for `/api/*`; required when Next starts |

Copy `.env.example` to `.env.local` in `apps/web`, then set the API origin. The browser never receives this value. The API also needs its own `DATABASE_URL` and other environment settings from the repository root example.

## Scripts

From the root, run `pnpm --filter @fernleaf/web dev` for local Next development, `pnpm --filter @fernleaf/web build` for a production build, and `pnpm --filter @fernleaf/web typecheck` for this package. The repository gates are `pnpm lint`, `pnpm typecheck`, and `pnpm test`.

The web scripts select Webpack because the shared ESM TypeScript source imports `.js` paths that map to `.ts` files. `next.config.ts` supplies that extension mapping.

## Add a feature

1. Put screens, hooks, and components in `src/features/<module>/`.
2. Add a thin route file in `src/app/<path>/page.tsx` that imports the feature screen. Use `ProtectedShell` around authenticated screens. For a route with a permission, check `can(user, contract.permission)` in the screen and show `/403` if denied. The server enforces the permission again.
3. Add `{ label, path, permission }` to `src/lib/nav.ts` once the shared contract permission exists. `ProtectedShell` filters the registry through `can()`.
4. Call `api.call(routeDescriptor, { params, query, body })` from a TanStack Query hook. The client uses the shared descriptor to build the URL, send cookies, and validate the response. Use query keys `[module, resource, params]` and invalidate after mutations. Do not call `fetch` in components.
5. Use `ServerTable` for list display and `useTableState(filterKeys)` to build the query passed to the route. Wrap a screen that uses `useSearchParams` in `Suspense` for static rendering. The table keeps page, page size, sort, and named filters in the URL.
6. Build forms with `@mantine/form` and `zod4Resolver(contract.body)`; call `showApiError(error, form.setFieldError)` after a failed mutation. Field details appear beside inputs; other errors produce a toast.

`formatMoney` takes integer cents. `formatKitchenDate`, `formatKitchenTime`, and `formatKitchenDateTime` take an ISO instant and an explicit kitchen zone. Supply the zone from settings when that contract is available.

## Current screens

Login and the four role landing pages are foundation placeholders. Dashboards and feature navigation will arrive with their API contracts. The landing path map selects each staff member's home page. No dashboard figures are claimed here.
