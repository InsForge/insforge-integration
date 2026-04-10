# InsForge + Clerk

[Clerk](https://clerk.com) is an authentication and user management platform that provides pre-built UI components and APIs for sign-up, sign-in, and user profiles. This example shows how to integrate Clerk with InsForge using Clerk's **JWT Templates** feature — Clerk signs tokens with InsForge's JWT secret, so InsForge accepts them natively for Row Level Security.

This is a React (Vite) todo list app where users sign in via Clerk and manage their own todos stored in InsForge. RLS policies ensure each user can only access their own data.

- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/clerk)
- [Integration Guide](https://insforge.dev/integrations/clerk)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Clerk](https://clerk.com) account and application

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/auth/clerk
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

### Step 4: Create a JWT Template in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Configure** > **JWT Templates**
3. Click **New template** and select **Blank**
4. Name it `insforge`
5. Set the **Signing algorithm** to `HS256`
6. Paste your InsForge **JWT Secret** (from Step 3) into the **Signing key** field
7. Set the token claims to:

```json
{
  "role": "authenticated",
  "aud": "insforge-api"
}
```

> `sub` and `iss` are reserved claims in Clerk and are automatically included — do not add them manually.

8. Save the template

### Step 5: Set Up Your Application

Fill in `.env.local`:

```env
VITE_INSFORGE_BASE_URL=...
VITE_INSFORGE_ANON_KEY=...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign up with a new user through Clerk.

> **Note**: Since authentication is handled entirely by Clerk, you will **not** see any users in the InsForge dashboard under **Auth > Users**. User records are managed in the [Clerk Dashboard](https://dashboard.clerk.com).

For a detailed walkthrough of the integration, see the [Clerk Integration Guide](https://insforge.dev/integrations/clerk).
