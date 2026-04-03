import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  beforeSessionSaved: async (session, idToken) => {
    if (idToken) {
      // Decode the ID token payload to extract custom claims
      const parts = idToken.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString()
          );
          const insforgeToken =
            payload["https://insforge.dev/insforge_token"];
          if (insforgeToken) {
            session.user["https://insforge.dev/insforge_token"] =
              insforgeToken;
          }
        } catch {}
      }
    }
    return session;
  },
});
