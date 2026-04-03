# InsForge + WorkOS

A Next.js application using **WorkOS AuthKit** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://workosauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/workos)
- [Integration Guide](https://insforge.dev/integrations/workos)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [WorkOS](https://workos.com) account
- Your InsForge project's **JWT Secret** (found in the InsForge dashboard under project settings)

## Step 1: Create a WorkOS Application

1. Log in to your [WorkOS Dashboard](https://dashboard.workos.com)
2. Go to **API Keys** and note down the **API Key** and **Client ID**
3. Navigate to **Redirects** and add `http://localhost:3000/callback`
4. Enable your desired authentication methods (email/password, social login, SSO, etc.)

## Step 2: Configure a JWT Template in WorkOS

1. In the WorkOS Dashboard, go to **Authentication** > **Sessions**
2. Click **Configure JWT Template**
3. Set the template to include InsForge-compatible claims:

```json
{
  "role": "authenticated",
  "aud": "insforge-api",
  "user_email": {{ user.email }}
}
```

> `sub` is a reserved claim automatically included by WorkOS — do not add it manually.

4. Save the template

## Step 3: Get Your InsForge JWT Secret

1. Open your InsForge dashboard
2. Navigate to your project settings
3. Copy the **JWT Secret**

## Step 4: Create a Helper Function for User IDs

Run the following SQL in the **InsForge SQL Editor**. Since WorkOS user IDs are strings (e.g., `user_01H...`) and InsForge's `auth.uid()` returns UUID, create a SQL function that reads the `sub` claim as text:

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

## Step 5: Set Up Your Database Schema

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

## Step 6: Set Up Your Next.js Application

Install the required dependencies:

```bash
npx create-next-app@latest my-app
cd my-app
npm install @workos-inc/authkit-nextjs @insforge/sdk jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

Add environment variables to `.env.local`:

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

Set up the callback route at `app/callback/route.ts`:

```typescript
import { handleAuth } from '@workos-inc/authkit-nextjs';

export const GET = handleAuth();
```

Add the AuthKit provider in `app/layout.tsx`:

```typescript
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>{children}</AuthKitProvider>
      </body>
    </html>
  );
}
```

Add the middleware at `middleware.ts`:

```typescript
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware();

export const config = { matcher: ['/', '/api/:path*'] };
```

Create a login route handler at `app/login/route.ts` to redirect unauthenticated users to the WorkOS sign-in page:

```typescript
import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export async function GET() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
```

> **Note:** `withAuth({ ensureSignedIn: true })` can cause cookie errors in server components (Next.js 16 limitation). Use `redirect('/login')` in your page to handle unauthenticated users instead.

## Step 7: Initialize the InsForge Client with WorkOS

Create a utility that retrieves the WorkOS user and signs an InsForge-compatible JWT at `lib/insforge.ts`:

```typescript
import { createClient } from '@insforge/sdk';
import { withAuth } from '@workos-inc/authkit-nextjs';
import jwt from 'jsonwebtoken';

export async function createInsForgeClient() {
  const { user } = await withAuth();

  if (!user) return null;

  const insforgeToken = jwt.sign(
    {
      sub: user.id,
      role: 'authenticated',
      aud: 'insforge-api',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.INSFORGE_JWT_SECRET!
  );

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken: insforgeToken,
  });
}
```

## Step 8: Use InsForge Services

```typescript
import { createInsForgeClient } from '@/lib/insforge';

// Insert a todo — user_id is automatically set from the WorkOS JWT
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
