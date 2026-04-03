# InsForge + Kinde

A Next.js application using **Kinde** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://kindeauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/kinde)
- [Integration Guide](https://insforge.dev/integrations/kinde)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Kinde](https://kinde.com) account and application
- Your InsForge project's **JWT Secret** settings (found in the InsForge dashboard under project settings)

## Step 1: Create a Kinde Application

1. Log in to your [Kinde Dashboard](https://app.kinde.com)
2. Select **Add application**
3. Name your application and choose **Back-end web** as the type
4. Select **Next.js** from the SDK list
5. Configure callback URLs:
   - **Allowed callback URL**: `http://localhost:3000/api/auth/kinde_callback`
   - **Allowed logout redirect URL**: `http://localhost:3000`
6. Enable desired authentication methods (Email, Google, etc.) under **Authentication**
7. Under **App Keys**, note down the **Domain**, **Client ID**, and **Client Secret**

## Step 2: Get Your InsForge JWT Secret

1. Open your InsForge dashboard
2. Navigate to your project settings
3. Copy the **JWT Secret** — you'll use it in a later step to sign tokens for InsForge

## Step 3: Create a Helper Function for User IDs

Run the following SQL in the **InsForge SQL Editor**. Since Kinde user IDs are strings (e.g., `kp_1234abcd`) and InsForge's `auth.uid()` returns UUID, create a SQL function that reads the `sub` claim as text:

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
```

## Step 4: Set Up Your Database Schema

Still in the **InsForge SQL Editor**, create your table. Use `TEXT` columns for user-linked fields. Set `requesting_user_id()` as the **default value** for the `user_id` column so it's automatically populated from the JWT on insert.

```sql
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

## Step 5: Set Up Your Next.js Application

Install the required dependencies:

```bash
npx create-next-app@latest my-app
cd my-app
npm install @kinde-oss/kinde-auth-nextjs @insforge/sdk jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

Add environment variables to `.env.local`:

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

Create the Kinde auth API route at `app/api/auth/[kindeAuth]/route.js`:

```javascript
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export const GET = handleAuth();
```

## Step 6: Initialize the InsForge Client with Kinde

Create a utility that retrieves the Kinde user, signs a JWT with the InsForge JWT secret, and passes it to InsForge:

```typescript
import { createClient } from '@insforge/sdk';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import jwt from 'jsonwebtoken';

export async function createInsForgeClient() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  let edgeFunctionToken: string | undefined;
  if (user) {
    edgeFunctionToken = jwt.sign(
      {
        sub: user.id,
        role: 'authenticated',
        aud: 'insforge-api',
        email: user.email,
      },
      process.env.INSFORGE_JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken,
  });
}
```

This signs a new JWT with InsForge's secret containing the Kinde user's `sub` claim, so InsForge can validate the token and extract user identity for RLS.

## Step 7: Use InsForge Services

```typescript
import { createInsForgeClient } from '@/lib/insforge';

// Insert a todo — user_id is automatically set from the Kinde JWT
const insforge = await createInsForgeClient();
const { data, error } = await insforge.database
  .from('todos')
  .insert({ title: 'My first todo' });

// Query todos — RLS ensures users only see their own data
const { data: todos } = await insforge.database
  .from('todos')
  .select('*');
```

## Run This Example

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
