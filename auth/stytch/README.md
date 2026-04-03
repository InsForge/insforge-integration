# InsForge + Stytch

A Next.js application using **Stytch** for passwordless authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://stytchauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/stytch)
- [Integration Guide](https://insforge.dev/integrations/stytch)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Stytch](https://stytch.com) account
- Your InsForge project's **JWT Secret** (found in the InsForge dashboard under project settings)

## Step 1: Configure Stytch

1. Log in to your [Stytch Dashboard](https://stytch.com/dashboard)
2. Navigate to **Redirect URLs** (in Test environment)
3. Add a redirect URL:
   - **URL**: `http://localhost:3000/authenticate`
   - **Type**: All
4. Navigate to **Frontend SDK** > **Configuration** and add `http://localhost:3000` as an authorized domain
5. Go to **Project overview** > **Project ID & API keys** and note down the **Project ID**, **Public Token**, and **Secret**

## Step 2: Create Your InsForge Project

1. Open your InsForge dashboard and create a new project (or use an existing one)
2. Note down the **URL** and **Anon Key**
3. Copy the **JWT Secret** — you'll use it to sign tokens for InsForge

## Step 3: Set Up Your Database Schema

Run the following SQL in the **InsForge SQL Editor**. Use `TEXT` columns for user IDs since Stytch user IDs are strings (e.g., `user-test-...`).

First, create a helper function to extract the user ID from JWT claims:

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

Still in the **InsForge SQL Editor**, create your table:

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

## Step 4: Set Up Your Next.js Application

```bash
npx create-next-app@latest my-app
cd my-app
npm install @stytch/nextjs @stytch/vanilla-js @insforge/sdk stytch jsonwebtoken
```

Add environment variables to `.env.local`:

```env
# Stytch
STYTCH_PROJECT_ENV='test'
STYTCH_PROJECT_ID='YOUR_PROJECT_ID'
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN='YOUR_PUBLIC_TOKEN'
STYTCH_SECRET='YOUR_SECRET'

# InsForge
NEXT_PUBLIC_INSFORGE_URL='YOUR_INSFORGE_URL'
NEXT_PUBLIC_INSFORGE_ANON_KEY='YOUR_INSFORGE_ANON_KEY'
INSFORGE_JWT_SECRET='YOUR_INSFORGE_JWT_SECRET'
```

## Step 5: Create Authentication Flow

First, create a Stytch provider wrapper at `app/stytch-provider.tsx`:

```typescript
'use client';

import { StytchProvider, createStytchUIClient } from '@stytch/nextjs';

const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!
);

export default function StytchProviderWrapper({ children }: { children: React.ReactNode }) {
  return <StytchProvider stytch={stytch}>{children}</StytchProvider>;
}
```

Wrap your app with the provider in `app/layout.tsx`:

```typescript
import StytchProviderWrapper from './stytch-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StytchProviderWrapper>{children}</StytchProviderWrapper>
      </body>
    </html>
  );
}
```

Set up the Stytch login component with email magic links at `app/login/page.tsx`:

```typescript
'use client';

import { Products, StytchLogin } from '@stytch/nextjs';

export default function Login() {
  const config = {
    products: [Products.emailMagicLinks],
    emailMagicLinksOptions: {
      loginRedirectURL: 'http://localhost:3000/authenticate',
      loginExpirationMinutes: 30,
      signupRedirectURL: 'http://localhost:3000/authenticate',
      signupExpirationMinutes: 30,
    },
  };

  return <StytchLogin config={config} />;
}
```

Create the authentication callback page at `app/authenticate/page.tsx`:

```typescript
'use client';

import { useStytch, useStytchSession } from '@stytch/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Authenticate() {
  const stytch = useStytch();
  const { session } = useStytchSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticating = useRef(false);

  useEffect(() => {
    if (session) {
      router.replace('/');
      return;
    }

    const token = searchParams.get('token');
    const type = searchParams.get('stytch_token_type');

    if (token && type === 'magic_links' && !authenticating.current) {
      authenticating.current = true;
      stytch.magicLinks
        .authenticate(token, { session_duration_minutes: 60 })
        .then(() => {
          router.replace('/');
        })
        .catch((err) => {
          console.error('Stytch authenticate error:', err);
          router.replace('/login');
        });
    }
  }, [stytch, session, router, searchParams]);

  return <div>Authenticating...</div>;
}
```

> **Note:** The authentication callback must be a client-side page, not a route handler. The Stytch SDK handles magic link tokens on the client side. You must also add `http://localhost:3000` as an allowed domain and `http://localhost:3000/authenticate` as a redirect URL in the Stytch Dashboard.

## Step 6: Initialize the InsForge Client with Stytch

Create a utility that signs a JWT with the InsForge secret, embedding the Stytch user ID at `lib/insforge.ts`:

```typescript
import { createClient } from '@insforge/sdk';
import jwt from 'jsonwebtoken';
import { Client, envs } from 'stytch';
import { cookies } from 'next/headers';

const stytchClient = new Client({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
  env: envs.test,
});

export async function createInsForgeClient() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('stytch_session')?.value;

  if (!sessionToken) return null;

  // Validate session with Stytch and get user ID
  const { session } = await stytchClient.sessions.authenticate({
    session_token: sessionToken,
  });

  // Sign a JWT for InsForge
  const payload = {
    userId: session.user_id,
    role: 'authenticated',
    aud: 'insforge-api',
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };
  const insforgeToken = jwt.sign(payload, process.env.INSFORGE_JWT_SECRET!);

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken: insforgeToken,
  });
}
```

## Step 7: Use InsForge Services

```typescript
import { createInsForgeClient } from '@/lib/insforge';

// Insert a todo — user_id is automatically set from the JWT
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
