import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { JwtClaims } from './auth.types';

export const PUBLIC_KEY = 'isPublic';

// Cache the JWKS fetcher so it is not recreated per request
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(jwksUri: string): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(jwksUri));
  }
  return jwksCache;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('auth.token.invalid');

    const jwksUri = this.config.get<string>('KEYCLOAK_JWKS_URI');
    if (!jwksUri) throw new UnauthorizedException('auth.token.invalid');

    try {
      const { payload } = await jwtVerify<JwtClaims>(token, getJwks(jwksUri));

      const realmRoles = payload.realm_access?.roles ?? [];
      const roles = payload.roles ?? realmRoles;

      req.user = {
        userId: payload.sub,
        keycloakId: payload.sub,
        tenantId: payload.tenant_id,
        email: payload.email,
        displayName: payload.name ?? payload.preferred_username ?? payload.email,
        roles,
      };

      return true;
    } catch {
      throw new UnauthorizedException('auth.token.expired');
    }
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
