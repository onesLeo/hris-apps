import assert from 'node:assert/strict';
import test from 'node:test';

// Test the token extraction logic in isolation — we do not call the real JWKS
// endpoint. The guard is tested via its private method behaviours and the
// public canActivate path using a mock that overrides jwtVerify.

import { JwtAuthGuard, PUBLIC_KEY } from '../../../src/modules/auth/jwt.guard.ts';

function makeGuard(jwksUri: string | undefined = 'http://localhost:8080/realms/hris/protocol/openid-connect/certs') {
  const config = {
    get: (_k: string) => jwksUri,
    getOrThrow: (_k: string) => jwksUri,
  };
  const reflector = {
    getAllAndOverride: (_key: string, _targets: unknown[]) => false,
  };
  return new JwtAuthGuard(config as never, reflector as never);
}

function makeContext(authHeader?: string, isPublic = false) {
  const reflector = {
    getAllAndOverride: (_key: string, _targets: unknown[]) => isPublic,
  };
  const config = { get: (_k: string) => 'http://kc/certs' };
  const guard = new JwtAuthGuard(config as never, reflector as never);
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
        user: undefined as unknown,
      }),
    }),
  };
  return { guard, context };
}

function makeBypassContext(nodeEnv: string, devBypass: string) {
  const reflector = {
    getAllAndOverride: (_key: string, _targets: unknown[]) => false,
  };
  const config = {
    get: (key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return nodeEnv;
        case 'DEV_AUTH_BYPASS':
          return devBypass;
        case 'DEFAULT_TENANT_ID':
          return 'tenant-1';
        case 'DEFAULT_USER_ID':
          return 'user-1';
        case 'DEV_AUTH_BYPASS_ROLES':
          return 'hris_admin';
        case 'KEYCLOAK_JWKS_URI':
          return 'http://kc/certs';
        default:
          return undefined;
      }
    },
  };
  const guard = new JwtAuthGuard(config as never, reflector as never);
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        user: undefined as unknown,
      }),
    }),
  };
  return { guard, context };
}

test('PUBLIC_KEY constant is the expected metadata key', () => {
  assert.equal(PUBLIC_KEY, 'isPublic');
});

test('canActivate returns true immediately for @Public() routes (no token needed)', async () => {
  const { guard, context } = makeContext(undefined, true);
  const result = await guard.canActivate(context as never);
  assert.equal(result, true);
});

test('canActivate throws UnauthorizedException when Authorization header is missing', async () => {
  const { guard, context } = makeContext(undefined, false);
  await assert.rejects(
    () => guard.canActivate(context as never),
    { message: 'auth.token.invalid' },
  );
});

test('canActivate allows dev auth bypass only in development', async () => {
  const { guard, context } = makeBypassContext('development', 'true');
  const result = await guard.canActivate(context as never);
  assert.equal(result, true);
});

test('canActivate rejects dev auth bypass outside development', async () => {
  const { guard, context } = makeBypassContext('production', 'true');
  await assert.rejects(
    () => guard.canActivate(context as never),
    { message: 'auth.token.invalid' },
  );
});

test('canActivate throws UnauthorizedException when Authorization header has wrong scheme', async () => {
  const { guard, context } = makeContext('Basic dXNlcjpwYXNz', false);
  await assert.rejects(
    () => guard.canActivate(context as never),
    { message: 'auth.token.invalid' },
  );
});

test('canActivate throws UnauthorizedException when KEYCLOAK_JWKS_URI is not configured', async () => {
  const reflector = { getAllAndOverride: () => false };
  const config = { get: () => undefined };
  const guard = new JwtAuthGuard(config as never, reflector as never);
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: 'Bearer some.jwt.token' },
      }),
    }),
  };
  await assert.rejects(() => guard.canActivate(context as never), { message: 'auth.token.invalid' });
});
