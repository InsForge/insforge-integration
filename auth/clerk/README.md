# InsForge + Clerk

A React (Vite) application using **Clerk** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://clerkauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/clerk)
- [Integration Guide](https://insforge.dev/integrations/clerk)

## Prerequisites

- An [InsForge](https://insforge.dev) project
- A [Clerk](https://clerk.com) account and application
- Node.js 18+

## Setup

### 1. Configure Clerk JWT Template

1. In the Clerk Dashboard, go to **Configure** > **JWT Templates** > **New template** > **Blank**
2. **Name**: `insforge`
3. **Signing algorithm**: `HS256`
4. **Signing key**: your InsForge **JWT Secret**
5. **Token claims**:

```json
{
  "role": "authenticated",
  "aud": "insforge-api"
}
```

> `sub` and `iss` are reserved claims in Clerk and are automatically included — do not add them manually.

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_INSFORGE_BASE_URL=...
VITE_INSFORGE_ANON_KEY=...               # optional
VITE_CLERK_PUBLISHABLE_KEY=pk_...        # required
```

### 3. Create the database table

Run `sql/clerk-insforge.sql` in the InsForge SQL Editor. It creates `requesting_user_id()`, CRM tables (`companies`, `contacts`, `deals`), applies `user_id default requesting_user_id()`, and sets RLS policies.

### 4. Run

```bash
npm install
npm run dev
```

## Key Implementation Notes

- `src/lib/insforge.ts`: injects Clerk token into InsForge requests using `getToken({ template: 'insforge' })`.
- `sql/clerk-insforge.sql`: reads Clerk user ID from `request.jwt.claims.sub` via `requesting_user_id()`, auto-fills `user_id` on insert, and enforces per-user access with RLS.
- Since Clerk user IDs are strings (e.g., `user_2xPnG8KxVQr`), `requesting_user_id()` reads the `sub` claim as text instead of UUID.
