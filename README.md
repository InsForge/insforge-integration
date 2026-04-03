<div align="center">
  <a href="https://insforge.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-light.svg">
      <img src="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-dark.svg" alt="InsForge" width="500">
    </picture>
  </a>

  <p>
    <a href="https://github.com/InsForge/InsForge"><img src="https://img.shields.io/badge/github-InsForge-181717?logo=github&logoColor=white" alt="GitHub"></a>
    <a href="https://x.com/InsForge_dev"><img src="https://img.shields.io/badge/X-%40InsForge__dev-000000?logo=x&logoColor=white" alt="X"></a>
    <a href="https://discord.gg/DvBtaEc9Jz"><img src="https://img.shields.io/badge/community-Discord-5865F2?logo=discord&logoColor=white" alt="Join community"></a>
  </p>


</div>

## InsForge Integrations

Sample applications showing how to integrate third-party authentication providers with InsForge. Each example is a standalone app that demonstrates JWT-based auth with InsForge's Row Level Security (RLS).

## Integrations

### Auth

| Integration | Framework | Demo | Guide |
| --- | --- | --- | --- |
| [`auth0`](./auth/auth0) | Next.js | [auth0auth.insforge.site](https://auth0auth.insforge.site) | [Guide](https://insforge.dev/integrations/auth0) |
| [`clerk`](./auth/clerk) | React + Vite | [clerkauth.insforge.site](https://clerkauth.insforge.site) | [Guide](https://insforge.dev/integrations/clerk) |
| [`kinde`](./auth/kinde) | Next.js | [kindeauth.insforge.site](https://kindeauth.insforge.site) | [Guide](https://insforge.dev/integrations/kinde) |
| [`stytch`](./auth/stytch) | Next.js | [stytchauth.insforge.site](https://stytchauth.insforge.site) | [Guide](https://insforge.dev/integrations/stytch) |
| [`workos`](./auth/workos) | Next.js | [workosauth.insforge.site](https://workosauth.insforge.site) | [Guide](https://insforge.dev/integrations/workos) |

## How It Works

Each integration follows the same pattern:

1. **User authenticates** with the third-party provider.
2. **A JWT is signed** with InsForge's JWT secret (either by the provider or server-side).
3. **The JWT is passed** to the InsForge SDK as `edgeFunctionToken`.
4. **InsForge validates** the token and enforces Row Level Security policies.

Since third-party auth providers use string-based user IDs (not UUIDs), all examples use a shared SQL helper function:

```sql
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text
$$;
```

## Repository Structure

```text
insforge-integration/
└── auth/
    ├── auth0/
    ├── clerk/
    ├── kinde/
    ├── stytch/
    └── workos/
```

Each directory is an independent application with its own dependencies, environment variables, and setup instructions.

## Getting Started

1. Clone the repository.
2. Move into the integration you want to use.
3. Install dependencies with `npm install`.
4. Copy the integration's example environment file.
5. Follow that integration's `README.md` for any required InsForge setup, provider configuration, and local development steps.

## Per-Integration Documentation

For full setup details, go directly to the integration README you want to use:

- [`auth/auth0/README.md`](./auth/auth0/README.md)
- [`auth/clerk/README.md`](./auth/clerk/README.md)
- [`auth/kinde/README.md`](./auth/kinde/README.md)
- [`auth/stytch/README.md`](./auth/stytch/README.md)
- [`auth/workos/README.md`](./auth/workos/README.md)

## Provide Feedback

- [Open an issue](../../issues/new) if you believe you've encountered a bug that you want to flag for the team.
