# InsForge + WorkOS

[WorkOS](https://workos.com) is an enterprise authentication platform that provides AuthKit (hosted login UI), Single Sign-On (SSO), SCIM directory sync, and user management. This example shows how to integrate WorkOS with InsForge in a Next.js application — WorkOS handles authentication and enterprise identity, while InsForge manages data authorization through Row Level Security (RLS) policies.

This is a Next.js todo list app where users sign in via WorkOS AuthKit and manage their own todos stored in InsForge.

- [Live Demo](https://workosauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/workos)
- [Integration Guide](https://insforge.dev/integrations/workos)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [WorkOS](https://workos.com) account

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/auth/workos
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

### Step 4: Create a JWT Template in WorkOS

1. Log in to your [WorkOS Dashboard](https://dashboard.workos.com)
2. Go to **API Keys** and note down the **API Key** and **Client ID**
3. Navigate to **Redirects** and add `http://localhost:3000/callback`
4. Go to **Authentication** > **Sessions** > **Configure JWT Template**
5. Set the template to:

```json
{
  "role": "authenticated",
  "aud": "insforge-api",
  "user_email": {{ user.email }}
}
```

> `sub` is a reserved claim automatically included by WorkOS — do not add it manually.

6. Save the template

### Step 5: Set Up Your Application

Fill in `.env.local`:

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

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with a new user through WorkOS AuthKit.

> **Note**: Since authentication is handled entirely by WorkOS, you will **not** see any users in the InsForge dashboard under **Auth > Users**. User records are managed in the [WorkOS Dashboard](https://dashboard.workos.com).

For a detailed walkthrough of the integration, see the [WorkOS Integration Guide](https://insforge.dev/integrations/workos).
