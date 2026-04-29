import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

async function refreshAccessToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const issuer = process.env['KEYCLOAK_ISSUER'];
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env['KEYCLOAK_CLIENT_ID'] ?? '',
        client_secret: process.env['KEYCLOAK_CLIENT_SECRET'] ?? '',
        refresh_token: token['refreshToken'] as string,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(data['error'] ?? 'RefreshFailed'));

    return {
      ...token,
      accessToken: data['access_token'],
      refreshToken: (data['refresh_token'] as string | undefined) ?? token['refreshToken'],
      expiresAt: Date.now() + (data['expires_in'] as number) * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env['KEYCLOAK_CLIENT_ID'] ?? '',
      clientSecret: process.env['KEYCLOAK_CLIENT_SECRET'] ?? '',
      issuer: process.env['KEYCLOAK_ISSUER'] ?? 'http://localhost:8080/realms/hris',
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: persist tokens from Keycloak into the JWT cookie
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: (account.expires_at ?? 0) * 1000,
          error: undefined,
        };
      }

      // Token still valid — return as-is
      if (Date.now() < (token['expiresAt'] as number ?? 0)) {
        return token;
      }

      // Expired — attempt refresh
      return refreshAccessToken(token as Record<string, unknown>);
    },

    async session({ session, token }) {
      const at = token['accessToken'] as string | undefined;
      const err = token['error'] as string | undefined;
      if (at) session.accessToken = at;
      if (err) session.error = err;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
