# InsForge + Clerk

A React (Vite) CRM application using **Clerk** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://clerkauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/clerk)
- [Integration Guide](https://insforge.dev/integrations/clerk)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Clerk](https://clerk.com) account and application
- Your InsForge project's **JWT Secret** (found in the InsForge dashboard under project settings)

## Step 1: Get Your InsForge JWT Secret

1. Open your InsForge dashboard
2. Navigate to your project settings
3. Copy the **JWT Secret**

## Step 2: Create a JWT Template in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Configure** > **JWT Templates**
3. Click **New template** and select **Blank**
4. Name it `insforge`
5. Set the **Signing algorithm** to `HS256`
6. Paste your InsForge **JWT Secret** into the **Signing key** field
7. Set the token claims to:

```json
{
  "role": "authenticated",
  "aud": "insforge-api"
}
```

> `sub` and `iss` are reserved claims in Clerk and are automatically included — do not add them manually.

8. Save the template

The `role` is set to `authenticated` so RLS policies work. `sub` (user ID) and `iss` are automatically included by Clerk — do not set them manually.

## Step 3: Create a Helper Function for User IDs

Since Clerk user IDs are strings (e.g., `user_2xPnG8KxVQr`) and InsForge's `auth.uid()` returns UUID, you need a SQL function that reads the `sub` claim as text:

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

Use `TEXT` columns for user-linked fields. Set `requesting_user_id()` as the **default value** for the `user_id` column so it's automatically populated from the JWT on insert — no need to pass it manually from your app code.

Run `sql/clerk-insforge.sql` in the InsForge SQL Editor. It creates `requesting_user_id()`, CRM tables (`companies`, `contacts`, `deals`), applies `user_id default requesting_user_id()`, and sets RLS policies.

## Step 5: Initialize the InsForge Client with Clerk

In your application, initialize the InsForge client and pass the Clerk token from the `insforge` JWT template:

```javascript
import { createClient } from '@insforge/sdk';
import { useAuth } from '@clerk/clerk-react';

const { getToken } = useAuth();

const insforge = createClient({
  baseUrl: 'YOUR_INSFORGE_URL',
  edgeFunctionToken: async () => {
    // Use the 'insforge' JWT template
    const token = await getToken({ template: 'insforge' });
    return token;
  },
});
```

`getToken({ template: 'insforge' })` tells Clerk to sign the token with your InsForge JWT secret using the template you created.

> If you're using Next.js, replace `@clerk/clerk-react` with `@clerk/nextjs`.

## Step 6: Use InsForge Services

```javascript
// Insert a contact — user_id is automatically set from the Clerk JWT
const { data, error } = await insforge.database
  .from('contacts')
  .insert({ name: 'Jane Smith', email: 'jane@example.com', company: 'Acme Inc' });

// Query contacts — RLS ensures users only see their own data
const { data: contacts } = await insforge.database
  .from('contacts')
  .select('*');
```

## Run This Example

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_INSFORGE_BASE_URL=...
VITE_INSFORGE_ANON_KEY=...               # optional
VITE_CLERK_PUBLISHABLE_KEY=pk_...        # required
```

```bash
npm install
npm run dev
```
