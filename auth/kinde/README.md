# InsForge + Kinde

[Kinde](https://kinde.com) is an authentication and user management platform for modern SaaS applications, supporting social logins, email/SMS, passwordless, and MFA out of the box. This example shows how to integrate Kinde with InsForge by signing a separate JWT server-side, since Kinde does not support custom JWT signing keys.

This is a Next.js todo list app where users sign in via Kinde and manage their own todos stored in InsForge.

- [Live Demo](https://kindeauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/kinde)
- [Integration Guide](https://insforge.dev/integrations/kinde)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Kinde](https://kinde.com) account and application

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/auth/kinde
npm install
cp .env.example .env.local
```

### Step 3: Set Up Your InsForge Project

Create a new project in the [InsForge dashboard](https://insforge.dev) and link it:

```bash
npx @insforge/cli link --project-id <your-project-id>
```

Get your JWT Secret:

```bash
npx @insforge/cli secrets get JWT_SECRET
```

### Step 4: Create a Kinde Application

1. Log in to your [Kinde Dashboard](https://app.kinde.com)
2. Select **Add application**
3. Name your application and choose **Back-end web** as the type
4. Select **Next.js** from the SDK list
5. Configure callback URLs:
   - **Allowed callback URL**: `http://localhost:3000/api/auth/kinde_callback`
   - **Allowed logout redirect URL**: `http://localhost:3000`
6. Enable desired authentication methods (Email, Google, etc.) under **Authentication**
7. Under **App Keys**, note down the **Domain**, **Client ID**, and **Client Secret**

### Step 5: Set Up Your Application

Fill in `.env.local`:

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

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with a new user through Kinde.

> **Note**: Since authentication is handled entirely by Kinde, you will **not** see any users in the InsForge dashboard under **Auth > Users**. User records are managed in the [Kinde Dashboard](https://app.kinde.com).

For a detailed walkthrough of the integration, see the [Kinde Integration Guide](https://insforge.dev/integrations/kinde).
