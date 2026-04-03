# InsForge + Kinde

A Next.js application using **Kinde** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://kindeauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/kinde)
- [Integration Guide](https://insforge.dev/integrations/kinde)

## Prerequisites

- An [InsForge](https://insforge.dev) project
- A [Kinde](https://kinde.com) account and application
- Node.js 18+

## Setup

### 1. Configure Kinde

1. In the Kinde Dashboard, create a **Back-end web** application
2. Select **Next.js** from the SDK list
3. Set **Allowed callback URL** to `http://localhost:3000/api/auth/kinde_callback`
4. Set **Allowed logout redirect URL** to `http://localhost:3000`
5. Note down the **Domain**, **Client ID**, and **Client Secret**

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Kinde
KINDE_CLIENT_ID='YOUR_KINDE_CLIENT_ID'
KINDE_CLIENT_SECRET='YOUR_KINDE_CLIENT_SECRET'
KINDE_ISSUER_URL='https://YOUR_DOMAIN.kinde.com'
KINDE_SITE_URL='http://localhost:3000'
KINDE_POST_LOGOUT_REDIRECT_URL='http://localhost:3000'
KINDE_POST_LOGIN_REDIRECT_URL='http://localhost:3000'

# InsForge
NEXT_PUBLIC_INSFORGE_URL='YOUR_INSFORGE_URL'
NEXT_PUBLIC_INSFORGE_ANON_KEY='YOUR_INSFORGE_ANON_KEY'
INSFORGE_JWT_SECRET='YOUR_INSFORGE_JWT_SECRET'
```

### 3. Create the database table

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

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Implementation Notes

- `lib/insforge.ts`: retrieves Kinde user, signs a JWT with InsForge's secret, and passes it to the InsForge client.
- Since Kinde user IDs are strings (e.g., `kp_1234abcd`), `requesting_user_id()` reads the `sub` claim as text instead of UUID.
- RLS policies ensure users can only access their own data.
