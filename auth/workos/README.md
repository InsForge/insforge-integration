# InsForge + WorkOS

A Next.js application using **WorkOS AuthKit** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://workosauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/workos)
- [Integration Guide](https://insforge.dev/integrations/workos)

## Prerequisites

- An [InsForge](https://insforge.dev) project
- A [WorkOS](https://workos.com) account
- Node.js 18+

## Setup

### 1. Configure WorkOS

1. In the WorkOS Dashboard, go to **API Keys** and note down the **API Key** and **Client ID**
2. Navigate to **Redirects** and add `http://localhost:3000/callback`
3. Enable your desired authentication methods (email/password, social login, SSO, etc.)

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# WorkOS
WORKOS_API_KEY='sk_example_...'
WORKOS_CLIENT_ID='client_...'
WORKOS_COOKIE_PASSWORD='use [openssl rand -hex 32] to generate a 32 bytes value'
NEXT_PUBLIC_WORKOS_REDIRECT_URI='http://localhost:3000/callback'

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

- `lib/insforge.ts`: retrieves WorkOS user via `withAuth()`, signs a JWT with InsForge's secret, and passes it to the InsForge client.
- Since WorkOS user IDs are strings (e.g., `user_01H...`), `requesting_user_id()` reads the `sub` claim as text instead of UUID.
- `middleware.ts`: uses `authkitMiddleware()` for session management.
- RLS policies ensure users can only access their own data.
