import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';

const DEV_LOGIN_ACCOUNTS = [
  {
    id: 'dev-hris-admin',
    username: 'hris.admin',
    password: 'Test@1234',
    name: 'HRIS Admin',
    email: 'hris.admin@example.local',
  },
  {
    id: 'dev-hr-manager',
    username: 'hr.manager',
    password: 'Test@1234',
    name: 'HR Manager',
    email: 'hr.manager@example.local',
  },
  {
    id: 'dev-employee',
    username: 'john.employee',
    password: 'Test@1234',
    name: 'John Employee',
    email: 'john.employee@example.local',
  },
] as const;

const allowDevLogin = process.env['NODE_ENV'] !== 'production';

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
    ...(allowDevLogin
      ? [
          CredentialsProvider({
            id: 'dev-login',
            name: 'Development Login',
            credentials: {
              username: { label: 'Username', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (!credentials?.username || !credentials.password) {
                return null;
              }

              const account = DEV_LOGIN_ACCOUNTS.find((entry) => (
                entry.username === credentials.username && entry.password === credentials.password
              ));

              if (!account) {
                return null;
              }

              return {
                id: account.id,
                name: account.name,
                email: account.email,
              };
            },
          }),
        ]
      : []),
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
    async jwt({ token, account, user }) {
      // First sign-in: persist tokens from Keycloak into the JWT cookie
      if (account) {
        return {
          ...token,
          ...(user?.name ? { name: user.name } : {}),
          ...(user?.email ? { email: user.email } : {}),
          ...(typeof user?.id === 'string' ? { sub: user.id } : {}),
          ...(account.access_token ? { accessToken: account.access_token } : {}),
          ...(account.refresh_token ? { refreshToken: account.refresh_token } : {}),
          ...(account.expires_at ? { expiresAt: account.expires_at * 1000 } : {}),
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
      if (typeof token.name === 'string' && session.user) session.user.name = token.name;
      if (typeof token.email === 'string' && session.user) session.user.email = token.email;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
