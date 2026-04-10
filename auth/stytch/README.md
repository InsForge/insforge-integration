# InsForge + Stytch

[Stytch](https://stytch.com) is a passwordless authentication platform that provides email magic links, OAuth, OTP, and WebAuthn. This example shows how to integrate Stytch with InsForge in a Next.js application — Stytch handles user authentication and session management, while InsForge manages data authorization through Row Level Security (RLS) policies.

This is a Next.js todo list app where users sign in via Stytch and manage their own todos stored in InsForge.

- [Live Demo](https://stytchauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/stytch)
- [Integration Guide](https://insforge.dev/integrations/stytch)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Stytch](https://stytch.com) account

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/auth/stytch
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

### Step 4: Configure Stytch

1. Log in to your [Stytch Dashboard](https://stytch.com/dashboard)
2. Navigate to **Redirect URLs** (in Test environment)
3. Add a redirect URL:
   - **URL**: `http://localhost:3000/authenticate`
   - **Type**: All
4. Navigate to **Frontend SDK** > **Configuration** and add `http://localhost:3000` as an authorized domain
5. Go to **Project overview** > **Project ID & API keys** and note down the **Project ID**, **Public Token**, and **Secret**

### Step 5: Set Up Your Application

Fill in `.env.local`:

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

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with a new user through Stytch.

> **Note**: Since authentication is handled entirely by Stytch, you will **not** see any users in the InsForge dashboard under **Auth > Users**. User records are managed in the [Stytch Dashboard](https://stytch.com/dashboard).

For a detailed walkthrough of the integration, see the [Stytch Integration Guide](https://insforge.dev/integrations/stytch).
