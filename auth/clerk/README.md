# InsForge + Clerk

A React (Vite) CRM application using **Clerk** for authentication and **InsForge** for database, with Row Level Security (RLS) so users can only access their own data.

- [Live Demo](https://clerkauth.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/auth/clerk)
- [Integration Guide](https://insforge.dev/integrations/clerk)

## Prerequisites

- An [InsForge](https://insforge.dev) project (self-hosted or cloud)
- A [Clerk](https://clerk.com) account and application
- Your InsForge project's **JWT Secret** (found in the InsForge dashboard under project settings)

## Step 1: Set Up Your InsForge Project

Create a new project or link an existing one:

```bash
# Create a new project
npx @insforge/cli create

# Or link an existing project
npx @insforge/cli link --project-id <your-project-id>
```

Then note down the **URL**, **Anon Key**, and **JWT Secret** from the InsForge dashboard (project settings).

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

## Step 3: Set Up Your Application

Fill in `.env` (or `.env.local` for Next.js):

```env
VITE_INSFORGE_BASE_URL=...
VITE_INSFORGE_ANON_KEY=...               # optional
VITE_CLERK_PUBLISHABLE_KEY=pk_...        # required
```

## Step 4: Set Up InsForge Integration

Ask your agent to complete the following steps:

### 1. Set up the InsForge client with Clerk

```text
Set up the InsForge client with Clerk authentication. I'm using React with Vite.
```

This initializes the InsForge client using `getToken({ template: 'insforge' })` from Clerk's `useAuth()` hook, passed as an async `edgeFunctionToken`.

### 2. Create the database schema

```text
Create a todos table with RLS. Columns: id, user_id, title, is_complete, created_at. Users should only be able to access their own todos.
```

This creates the `requesting_user_id()` helper function (since Clerk user IDs are strings, not UUIDs) and a `todos` table with Row Level Security policies.

### 3. Build the todo list page

```text
Build a todo list page with full CRUD — create, read, update, and delete todos.
```

This creates a page that uses the InsForge client to manage todos. RLS ensures users only see their own data.

## Run This Example

```bash
cp .env.example .env
npm install
npm run dev
```
