import { createClient } from '@insforge/sdk';
import { withAuth } from '@workos-inc/authkit-nextjs';
import jwt from 'jsonwebtoken';

export async function createInsForgeClient() {
  const { user, accessToken } = await withAuth({ ensureSignedIn: true });

  const insforgeToken = jwt.sign(
    {
      sub: user.id,
      role: 'authenticated',
      aud: 'insforge-api',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.INSFORGE_JWT_SECRET!
  );

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken: insforgeToken,
  });
}
