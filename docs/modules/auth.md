# Auth and staff administration

## How it works

`StaffUser` stores the normalized email, Argon2 password hash, one registry role, and active state. `Session` stores a SHA-256 hash of a random token and an expiry; the browser receives only the token in an HTTP-only cookie. The permission guard loads the session on each protected request and calls shared `can(user, permission)`. The global input interceptor validates request inputs from each route contract. An admin can list staff, create one, change a role, reset a password, and deactivate an account. Password reset and deactivation revoke that account's sessions. Five failed login attempts for one email in 15 minutes cause a temporary throttle.

## Demo script

1. With the existing PostgreSQL server running, run `pnpm db:create`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`, and `pnpm --filter @fernleaf/web dev`.
2. Open `http://localhost:3000`, sign in as `admin@test.com` with `Test@1234`, then choose Staff from the sidebar.
3. Create a staff account, change its role, reset its password, then deactivate it. The table updates after each action.
4. Sign in as `kitchen@test.com`. Staff is absent from the sidebar; `GET /api/staff` returns 403.

## Out of scope

Password recovery by email, audit logs, and single sign-on are outside the platform scope.
