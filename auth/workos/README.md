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

## Step 3: Set Up Your InsForge Project

Create a new project or link an existing one:

```bash
# Create a new project
npx @insforge/cli create

# Or link an existing project
npx @insforge/cli link --project-id <your-project-id>
```

Then note down the **URL**, **Anon Key**, and **JWT Secret** from the InsForge dashboard (project settings).

## Step 4: Set Up Your Application

Install the required dependencies:

```bash
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

## Step 5: Set Up InsForge Integration

Ask your agent to complete the following steps:

### 1. Set up WorkOS AuthKit and InsForge integration

```text
Set up WorkOS AuthKit and InsForge integration for my Next.js app — callback route, provider, middleware, and login route.
```

This creates the callback route (`app/callback/route.ts`), AuthKitProvider wrapper (`app/layout.tsx`), middleware (`middleware.ts`), and login route (`app/login/route.ts`).

### 2. Create the InsForge client utility

```text
Create the InsForge client utility that uses the WorkOS session to sign a JWT for InsForge.
```

This creates a server-side utility (`lib/insforge.ts`) that gets the WorkOS user via `withAuth()`, signs a JWT with the InsForge secret, and passes it as `edgeFunctionToken`.

### 3. Create the database schema

```text
Create a todos table with RLS. Columns: id, user_id, title, is_complete, created_at. Users should only be able to access their own todos.
```

This creates the `requesting_user_id()` helper function (since WorkOS user IDs are strings, not UUIDs) and a `todos` table with Row Level Security policies.

### 4. Build the todo list page

```text
Build a todo list page with full CRUD — create, read, update, and delete todos.
```

This creates a page that uses the InsForge client to manage todos. RLS ensures users only see their own data.

## Run This Example

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
