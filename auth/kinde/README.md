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

## Step 2: Set Up Your InsForge Project

Create a new project or link an existing one:

```bash
# Create a new project
npx @insforge/cli create

# Or link an existing project
npx @insforge/cli link --project-id <your-project-id>
```

Then note down the **URL**, **Anon Key**, and **JWT Secret** from the InsForge dashboard (project settings). You'll use the JWT Secret in a later step to sign tokens for InsForge.

## Step 3: Set Up Your Application

Install the required dependencies:

```bash
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

## Step 4: Set Up InsForge Integration

Ask your agent to complete the following steps:

### 1. Create the InsForge client utility

```text
Create the InsForge client utility that signs a JWT using the Kinde user session.
```

This creates a server-side utility (`lib/insforge.ts`) that gets the Kinde user via `getKindeServerSession()`, signs a JWT with the InsForge secret, and passes it as `edgeFunctionToken`.

### 2. Create the database schema

```text
Create a todos table with RLS. Columns: id, user_id, title, is_complete, created_at. Users should only be able to access their own todos.
```

This creates the `requesting_user_id()` helper function (since Kinde user IDs are strings, not UUIDs) and a `todos` table with Row Level Security policies.

### 3. Build the todo list page

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
