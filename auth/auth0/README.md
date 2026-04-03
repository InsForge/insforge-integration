# InsForge + Auth0

A Next.js application using **Auth0** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://auth0auth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/auth0)
- [Integration Guide](https://insforge.dev/integrations/auth0)

## Prerequisites

- An [InsForge](https://insforge.dev) project
- An [Auth0](https://auth0.com) account and tenant
- Node.js 18+

## Setup

### 1. Configure Auth0

1. In Auth0 Dashboard, create a **Regular Web Application**
2. Set **Allowed Callback URLs** to `http://localhost:3000/auth/callback`
3. Set **Allowed Logout URLs** to `http://localhost:3000`
4. Note down the **Domain**, **Client ID**, and **Client Secret**

### 2. Create Auth0 Post Login Action

1. Go to **Actions** > **Library** > **Build Custom**
2. Name: `Generate InsForge Token`, Trigger: **Post Login**
3. Add `jsonwebtoken` as a dependency
4. Add `INSFORGE_JWT_SECRET` as a secret (from your InsForge dashboard)
5. Use this code:

```js
const jwt = require('jsonwebtoken');

exports.onExecutePostLogin = async (event, api) => {
  const payload = {
    sub: event.user.user_id,
    role: 'authenticated',
    aud: 'insforge-api',
    email: event.user.email,
  };

  const insforgeToken = jwt.sign(payload, event.secrets.INSFORGE_JWT_SECRET, {
    expiresIn: '1h',
  });

  api.idToken.setCustomClaim('https://insforge.dev/insforge_token', insforgeToken);
};
```

6. **Deploy**, then go to **Actions** > **Flows** > **Login** and drag the action into the flow

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Auth0
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant.us.auth0.com'
AUTH0_CLIENT_ID='your_auth0_client_id'
AUTH0_CLIENT_SECRET='your_auth0_client_secret'

# InsForge
NEXT_PUBLIC_INSFORGE_URL='YOUR_INSFORGE_URL'
```

### 4. Create the database table

Run in the InsForge SQL Editor:

```sql
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text
$$;

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default requesting_user_id(),
  title text not null,
  is_complete boolean default false,
  created_at timestamptz default now()
);

alter table public.todos enable row level security;

create policy "Users can manage own todos"
  on public.todos for all to authenticated
  using (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());
```

### 5. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Implementation Notes

- `lib/auth0.ts`: configures `beforeSessionSaved` hook to extract `insforge_token` from the Auth0 ID token into the session.
- `lib/insforge.ts`: initializes the InsForge client with the token from Auth0's session.
- Auth0 Post Login Action signs a separate JWT with InsForge's secret, embedded as a custom claim in the ID token.
- Since Auth0 user IDs are strings (e.g., `auth0|64a...`), `requesting_user_id()` reads the `sub` claim as text instead of UUID.
- RLS policies ensure users can only access their own data.
