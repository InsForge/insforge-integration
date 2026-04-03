# Auth0 + InsForge Todo App

A Next.js application using **Auth0** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

## Features

- Auth0 authentication (login, logout, session management)
- InsForge database with RLS
- Todo CRUD (create, read, update, delete)
- Light/dark theme switcher
- Auth0 Post Login Action signs an InsForge-compatible JWT
- Built with Next.js 15, Tailwind CSS, TypeScript

## Prerequisites

- An [InsForge](https://insforge.dev) project
- An [Auth0](https://auth0.com) account and tenant
- Node.js 18+

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Auth0_Insforge
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# InsForge
NEXT_PUBLIC_INSFORGE_URL=https://your-app.region.insforge.app

# Auth0
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant.us.auth0.com'
AUTH0_CLIENT_ID='your_auth0_client_id'
AUTH0_CLIENT_SECRET='your_auth0_client_secret'
```

### 3. Configure Auth0

1. In Auth0 Dashboard, create a **Regular Web Application**
2. Set **Allowed Callback URLs** to `http://localhost:3000/auth/callback`
3. Set **Allowed Logout URLs** to `http://localhost:3000`

### 4. Create Auth0 Post Login Action

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

### 5. Create the database table

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

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
