import { createClient } from '@insforge/sdk';
import jwt from 'jsonwebtoken';
import { Client, envs } from 'stytch';

const stytchClient = new Client({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
  env: envs.test,
});

export async function createInsForgeClient(sessionToken: string | null | undefined) {
  if (!sessionToken) return null;

  try {
    // Validate session with Stytch and get user ID
    const { session } = await stytchClient.sessions.authenticate({
      session_token: sessionToken,
    });

    // Sign a JWT for InsForge
    const payload = {
      userId: session.user_id,
      role: 'authenticated',
      aud: 'insforge-api',
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };
    const insforgeToken = jwt.sign(payload, process.env.INSFORGE_JWT_SECRET!);

    return createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      edgeFunctionToken: insforgeToken,
    });
  } catch (err) {
    console.error('[insforge] error:', err);
    throw err;
  }
}
