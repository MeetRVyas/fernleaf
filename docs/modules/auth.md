# Auth and staff administration

## How it works

`StaffUser` stores the normalized email, Argon2 password hash, one registry role, and active state. `Session` stores a SHA-256 hash of a random token and an expiry; the browser receives only the token in an HTTP-only cookie. The permission guard loads the session on each protected request and calls shared `can(user, permission)`. The global input interceptor validates request inputs from each route contract. An admin can list staff, create one, change a role, reset a password, and deactivate an account. Password reset and deactivation revoke that account's sessions. Five failed login attempts for one email in 15 minutes cause a temporary throttle.

## Demo script

1. Run `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm dev`.
2. Send `POST /api/auth/login` with `admin@test.com` and `Test@1234`; use the returned cookie.
3. Send `GET /api/auth/me` and `GET /api/staff` with the cookie.
4. Create a staff account, change its role, reset its password, then deactivate it. Check that its previous session no longer authorizes `GET /api/auth/me`.
5. Send `GET /api/staff` with a kitchen role cookie and observe a 403 error shape.

## Out of scope

Password recovery by email, audit logs, and single sign-on are outside the platform scope. The web login screen belongs to Session W.
