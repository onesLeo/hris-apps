export type JwtClaims = {
  sub: string;
  email: string;
  preferred_username?: string;
  name?: string;
  tenant_id?: string;
  roles?: string[];
  realm_access?: { roles: string[] };
  iat: number;
  exp: number;
};

export type AuthenticatedUser = {
  userId: string;
  keycloakId: string;
  tenantId: string;
  email: string;
  displayName: string;
  roles: string[];
};

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
