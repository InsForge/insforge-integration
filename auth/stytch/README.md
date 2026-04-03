# InsForge + Stytch

A Next.js application using **Stytch** for passwordless authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://stytchauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/stytch)
- [Integration Guide](https://insforge.dev/integrations/stytch)

## Prerequisites

- An [InsForge](https://insforge.dev) project
- A [Stytch](https://stytch.com) account
- Node.js 18+

## Setup

### 1. Configure Stytch

1. In the Stytch Dashboard, navigate to **Redirect URLs** (in Test environment)
2. Add a redirect URL: `http://localhost:3000/authenticate` (Type: All)
3. Navigate to **Frontend SDK** > **Configuration** and add `http://localhost:3000` as an authorized domain
4. Go to **Project overview** > **Project ID & API keys** and note down the **Project ID**, **Public Token**, and **Secret**

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Stytch
STYTCH_PROJECT_ENV='test'
STYTCH_PROJECT_ID='YOUR_PROJECT_ID'
STYTCH_PUBLIC_TOKEN='YOUR_PUBLIC_TOKEN'
STYTCH_SECRET='YOUR_SECRET'

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

- `lib/insforge.ts`: validates Stytch session server-side, signs a JWT with InsForge's secret containing the Stytch user ID, and passes it to the InsForge client.
- Since Stytch user IDs are strings (e.g., `user-test-...`), `requesting_user_id()` reads the `sub` claim as text instead of UUID.
- Authentication uses email magic links via the Stytch UI component.
- RLS policies ensure users can only access their own data.
