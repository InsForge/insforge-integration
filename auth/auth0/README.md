# InsForge + Auth0

[Auth0](https://auth0.com) is an authentication and authorization platform that supports social logins, enterprise federation, and passwordless authentication. This example shows how to integrate Auth0 with InsForge using a **Post Login Action** that signs a custom JWT with InsForge's secret, so InsForge accepts Auth0 tokens natively for Row Level Security.

This is a Next.js todo list app where users sign in via Auth0 and manage their own todos stored in InsForge.

- [Live Demo](https://auth0auth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/auth0)
- [Integration Guide](https://insforge.dev/integrations/auth0)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- An [Auth0](https://auth0.com) account and tenant

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/auth/auth0
npm install
cp .env.example .env.local
```

### Step 3: Set Up Your InsForge Project

Create a new project in the [InsForge dashboard](https://insforge.dev) and link it:

```bash
npx @insforge/cli link --project-id <your-project-id>
```

Get your **InsForge URL** and **Anon Key** from **Project Settings** in the [InsForge dashboard](https://insforge.dev).

Get your JWT Secret:

```bash
npx @insforge/cli secrets get JWT_SECRET
```

### Step 4: Create an Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com)
2. Go to **Applications** > **Applications** > **Create Application**
3. Choose **Regular Web Application** and give it a name (if prompted to select a technology, choose **Next.js** or skip — it only affects which quickstart guide Auth0 shows you)
4. In the **Settings** tab, configure:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
5. Note down the **Domain**, **Client ID**, and **Client Secret**

### Step 5: Create a Post Login Action in Auth0

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

5. Go to **Secrets** (in the action editor sidebar) and add `INSFORGE_JWT_SECRET` with your InsForge JWT Secret value (from Step 3)
6. Click **Deploy**
7. Go to **Actions** > **Triggers** > **post-login**, drag your action into the flow, and click **Apply**

### Step 6: Set Up Your Application

Fill in `.env.local`:

```env
# Auth0
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='YOUR_AUTH0_DOMAIN'
AUTH0_CLIENT_ID='YOUR_CLIENT_ID'
AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'

# InsForge
NEXT_PUBLIC_INSFORGE_URL='YOUR_INSFORGE_URL'
```

### Step 7: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with a new user through Auth0.

> **Note**: Since authentication is handled entirely by Auth0, you will **not** see any users in the InsForge dashboard under **Auth > Users**. User records are managed in the [Auth0 Dashboard](https://manage.auth0.com).

For a detailed walkthrough of the integration, see the [Auth0 Integration Guide](https://insforge.dev/integrations/auth0).
