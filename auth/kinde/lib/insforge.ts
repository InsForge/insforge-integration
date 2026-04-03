import { createClient } from '@insforge/sdk';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import jwt from 'jsonwebtoken';

export async function createInsForgeClient() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  let edgeFunctionToken: string | undefined;
  if (user) {
    edgeFunctionToken = jwt.sign(
      {
        sub: user.id,
        role: 'authenticated',
        aud: 'insforge-api',
        email: user.email,
      },
      process.env.INSFORGE_JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken,
  });
}
