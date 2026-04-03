# InsForge + Clerk (JWT Template / HS256)

This project demonstrates using **Clerk** for authentication instead of InsForge built-in auth, then passing Clerk-issued JWTs as InsForge SDK `accessToken` so PostgREST + RLS can validate claims directly (without backend code changes).

## 1) Configure Clerk JWT Template

In the Clerk Dashboard:

- `Configure -> JWT Templates -> New template -> Blank`
- **Name**: `insforge`
- **Signing algorithm**: `HS256`
- **Signing key**: your **InsForge JWT Secret**
- **Token claims**:

```json
{
  "role": "authenticated",
  "aud": "insforge-api"
}
```

Note: `sub` is a reserved Clerk claim and is included automatically.

## 2) Initialize Database (SQL)

Run `sql/clerk-insforge.sql` in your InsForge database. It creates `requesting_user_id()`, CRM tables (`companies`, `contacts`, `deals`), applies `user_id default requesting_user_id()`, and sets RLS policies.

If preferred, run it through MCP `run-raw-sql`.

## 3) Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
VITE_INSFORGE_BASE_URL=...
VITE_INSFORGE_ANON_KEY=...               # optional
VITE_CLERK_PUBLISHABLE_KEY=pk_...        # required
```

## 4) Run

```bash
npm install
npm run dev
```

## Key Implementation Notes

- `src/lib/insforge.ts`: injects Clerk token into InsForge requests using `getToken({ template: 'insforge' })`.
- `sql/clerk-insforge.sql`: reads Clerk user id from `request.jwt.claims.sub` via `requesting_user_id()`, auto-fills `user_id` on insert, and enforces per-user access with RLS.

