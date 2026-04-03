# InsForge + Auth0

A Next.js application using **Auth0** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://auth0auth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/auth0)
- [Integration Guide](https://insforge.dev/integrations/auth0)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- An [Auth0](https://auth0.com) account and tenant
- A Next.js application (or any framework — adjust the client code accordingly)
- Your InsForge project's **JWT Secret** (found in the InsForge dashboard under project settings)

## Step 1: Create an Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com)
2. Go to **Applications** > **Applications** > **Create Application**
3. Choose **Regular Web Application** and give it a name (if prompted to select a technology, choose **Next.js** or skip — it only affects which quickstart guide Auth0 shows you)
4. In the **Settings** tab, configure:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
5. Note down the **Domain**, **Client ID**, and **Client Secret**

## Step 2: Get Your InsForge JWT Secret

1. Open your InsForge dashboard
2. Navigate to your project settings
3. Copy the **JWT Secret** — you'll use it in the next step to sign tokens Auth0 issues

## Step 3: Create a Post Login Action in Auth0

Auth0 uses **Actions** to customize the authentication pipeline. Create an action that signs a separate JWT containing InsForge-compatible claims.

1. In the Auth0 Dashboard, go to **Actions** > **Library** > **Build Custom**
2. Name it `Generate InsForge Token` and select **Post Login** as the trigger
3. Add the `jsonwebtoken` dependency (click **Dependencies** > **Add Dependency** > search `jsonwebtoken`)
4. Replace the code with:

```javascript
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

  // Auth0 requires custom claims to use a URL namespace
  api.idToken.setCustomClaim('https://insforge.dev/insforge_token', insforgeToken);
};
```

5. Go to **Secrets** (in the action editor sidebar) and add `INSFORGE_JWT_SECRET` with your InsForge JWT Secret value
6. Click **Deploy**
7. Go to **Actions** > **Triggers** > **post-login**, drag your action into the flow, and click **Apply**

## Step 4: Create a Helper Function for User IDs

Run the following SQL in the **InsForge SQL Editor**. Since Auth0 user IDs are strings (e.g., `auth0|64a...`) and InsForge's `auth.uid()` returns UUID, create a SQL function that reads the `sub` claim as text:

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
npm install @auth0/nextjs-auth0 @insforge/sdk
```

Add environment variables to `.env.local`:

```env
# Auth0
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='YOUR_AUTH0_DOMAIN'
AUTH0_CLIENT_ID='YOUR_CLIENT_ID'
AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'

# InsForge
NEXT_PUBLIC_INSFORGE_URL='YOUR_INSFORGE_URL'
NEXT_PUBLIC_INSFORGE_ANON_KEY='YOUR_INSFORGE_ANON_KEY'
```

Create the Auth0 client at `lib/auth0.ts`:

> **Important:** Auth0 v4 SDK filters custom claims from the ID token by default. You must configure the `beforeSessionSaved` hook to manually extract `insforge_token` from the ID token and write it into the session, otherwise `getSession().user` will not contain this field.

```typescript
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  beforeSessionSaved: async (session, idToken) => {
    if (idToken) {
      try {
        const parts = idToken.split(".");
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString()
        );
        const insforgeToken = payload["https://insforge.dev/insforge_token"];
        if (insforgeToken) {
          session.user["https://insforge.dev/insforge_token"] = insforgeToken;
        }
      } catch {}
    }
    return session;
  },
});
```

Add the Auth0 middleware at `middleware.ts` in your project root. This replaces the API route — no `app/api/auth/[auth0]/route.js` is needed in v4:

```typescript
import { auth0 } from "@/lib/auth0";

export const middleware = auth0.middleware();

export const config = {
  matcher: ["/auth/:path*", "/protected/:path*"],
};
```

Wrap your application with `Auth0Provider` in `app/layout.tsx`:

```typescript
import { Auth0Provider } from '@auth0/nextjs-auth0/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
```

## Step 7: Initialize the InsForge Client with Auth0

Create a utility to initialize the InsForge client using the token from Auth0's session:

```typescript
import { createClient } from '@insforge/sdk';
import { auth0 } from '@/lib/auth0';

export async function createInsForgeClient() {
  const session = await auth0.getSession();
  const insforgeToken = session?.user?.["https://insforge.dev/insforge_token"];

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    edgeFunctionToken: insforgeToken,
  });
}
```

## Step 8: Use InsForge Services

```typescript
import { createInsForgeClient } from '@/lib/insforge';

// Insert a todo — user_id is automatically set from the Auth0 JWT
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
