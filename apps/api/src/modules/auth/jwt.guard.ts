import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { RequestContext } from '../../common/context/request-context';
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

    let payload: JwtClaims;
    try {
      ({ payload } = await jwtVerify<JwtClaims>(token, getJwks(jwksUri)));
    } catch {
      throw new UnauthorizedException('auth.token.expired');
    }

    const defaultTenantId = this.config.get<string>('DEFAULT_TENANT_ID');
    const defaultUserId = this.config.get<string>('DEFAULT_USER_ID');
    const tenantId = payload.tenant_id ?? defaultTenantId;
    const userId = defaultUserId ?? payload.sub;

    const realmRoles = payload.realm_access?.roles ?? [];
    const roles = payload.roles ?? realmRoles;

    if (!tenantId || !userId) {
      throw new UnauthorizedException('auth.token.invalid');
    }

    req.user = {
      userId,
      keycloakId: payload.sub,
      tenantId,
      email: payload.email,
      displayName: payload.name ?? payload.preferred_username ?? payload.email,
      roles,
    };

    const requestContext = RequestContext.get();
    if (requestContext) {
      requestContext.tenantId = tenantId;
      requestContext.userId = userId;
      const actorRole = roles[0];
      if (actorRole) {
        requestContext.actorRole = actorRole;
      }
    }

    return true;
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
