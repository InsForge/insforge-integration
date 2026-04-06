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

## Step 2: Set Up Your InsForge Project

Create a new project or link an existing one:

```bash
# Create a new project
npx @insforge/cli create

# Or link an existing project
npx @insforge/cli link --project-id <your-project-id>
```

Then note down the **URL**, **Anon Key**, and **JWT Secret** from the InsForge dashboard (project settings). You'll use the JWT Secret in the next step to sign tokens Auth0 issues.

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

## Step 4: Set Up Your Application

Install the required dependencies:

```bash
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

## Step 5: Set Up InsForge Integration

Ask your agent to complete the following steps:

### 1. Set up Auth0 and InsForge integration

```text
Set up Auth0 and InsForge integration for my Next.js app — Auth0 client, middleware, provider, and InsForge client utility.
```

This creates the Auth0 client with token extraction (`lib/auth0.ts`), middleware (`middleware.ts`), Auth0Provider wrapper (`app/layout.tsx`), and the InsForge client utility (`lib/insforge.ts`).

### 2. Create the database schema

```text
Create a todos table with RLS. Columns: id, user_id, title, is_complete, created_at. Users should only be able to access their own todos.
```

This creates the `requesting_user_id()` helper function (since Auth0 user IDs are strings, not UUIDs) and a `todos` table with Row Level Security policies.

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
