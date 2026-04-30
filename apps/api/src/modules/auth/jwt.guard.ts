import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
  private readonly logger = new Logger(JwtAuthGuard.name);

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
    const devAuthBypass = this.config.get<string>('DEV_AUTH_BYPASS') === 'true';
    const defaultTenantId = this.config.get<string>('DEFAULT_TENANT_ID');
    const defaultUserId = this.config.get<string>('DEFAULT_USER_ID');
    const defaultRoles = (this.config.get<string>('DEV_AUTH_BYPASS_ROLES') ?? 'hris_admin')
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);

    if (!token) {
      if (devAuthBypass && defaultTenantId && defaultUserId) {
        this.logger.warn(`dev auth bypass enabled for ${req.method} ${req.url}`);
        req.user = {
          userId: defaultUserId,
          keycloakId: defaultUserId,
          tenantId: defaultTenantId,
          email: 'dev@example.local',
          displayName: 'Dev User',
          roles: defaultRoles,
        };

        const requestContext = RequestContext.get();
        if (requestContext) {
          requestContext.tenantId = defaultTenantId;
          requestContext.userId = defaultUserId;
          if (defaultRoles[0]) {
            requestContext.actorRole = defaultRoles[0];
          }
        }

        return true;
      }

      this.logger.warn(`missing bearer token for ${req.method} ${req.url}`);
      throw new UnauthorizedException('auth.token.invalid');
    }

    const jwksUri = this.config.get<string>('KEYCLOAK_JWKS_URI');
    if (!jwksUri) {
      this.logger.error('KEYCLOAK_JWKS_URI is not configured');
      throw new UnauthorizedException('auth.token.invalid');
    }

    let payload: JwtClaims;
    try {
      ({ payload } = await jwtVerify<JwtClaims>(token, getJwks(jwksUri)));
    } catch {
      this.logger.warn(`token verification failed for ${req.method} ${req.url}`);
      throw new UnauthorizedException('auth.token.expired');
    }

    const tenantId = payload.tenant_id ?? defaultTenantId;
    const userId = defaultUserId ?? payload.sub;

    const realmRoles = payload.realm_access?.roles ?? [];
    const roles = payload.roles ?? realmRoles;

    if (!tenantId || !userId) {
      this.logger.warn(`token missing tenant/user for ${req.method} ${req.url}`);
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
