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

## Step 2: Set Up Your InsForge Project

Create a new project or link an existing one:

```bash
# Create a new project
npx @insforge/cli create

# Or link an existing project
npx @insforge/cli link --project-id <your-project-id>
```

Then note down the **URL**, **Anon Key**, and **JWT Secret** from the InsForge dashboard (project settings). You'll use the JWT Secret to sign tokens for InsForge.

## Step 3: Set Up Your Application

Install the required dependencies:

```bash
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

## Step 4: Set Up InsForge Integration

Ask your agent to complete the following steps:

### 1. Set up the Stytch authentication flow

```text
Set up the Stytch authentication flow for my Next.js app — provider, login page with magic links, and authentication callback page.
```

This creates the Stytch provider wrapper (`app/stytch-provider.tsx`), login page (`app/login/page.tsx`), and callback page (`app/authenticate/page.tsx`). The callback must be a client-side page, not a route handler.

### 2. Create the InsForge client utility

```text
Create the InsForge client utility that validates the Stytch session and signs a JWT for InsForge.
```

This creates a server-side utility (`lib/insforge.ts`) that reads the Stytch session cookie, validates it with the Stytch Node SDK, signs a JWT with the InsForge secret, and passes it as `edgeFunctionToken`.

### 3. Create the database schema

```text
Create a todos table with RLS. Columns: id, user_id, title, is_complete, created_at. Users should only be able to access their own todos.
```

This creates the `requesting_user_id()` helper function (since Stytch user IDs are strings, not UUIDs) and a `todos` table with Row Level Security policies.

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
