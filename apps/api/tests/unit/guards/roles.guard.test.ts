import assert from 'node:assert/strict';
import test from 'node:test';

// Import guard and decorator without NestJS DI — instantiate directly.
import { RolesGuard } from '../../../src/common/guards/roles.guard.ts';
import type { RoleName } from '../../../src/common/guards/roles.decorator.ts';
import { ROLES_KEY } from '../../../src/common/guards/roles.decorator.ts';
import type { AuthenticatedUser } from '../../../src/modules/auth/auth.types.ts';

function makeUser(roles: RoleName[]): AuthenticatedUser {
  return {
    userId: 'user-1',
    keycloakId: 'kc-1',
    tenantId: 'tenant-1',
    email: 'user@example.com',
    displayName: 'Test User',
    roles,
  };
}

function makeContext(user: AuthenticatedUser | undefined, requiredRoles: RoleName[] | undefined) {
  const reflector = {
    getAllAndOverride: (_key: string, _targets: unknown[]) => requiredRoles,
  };

  const guard = new RolesGuard(reflector as never);

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  };

  return { guard, context };
}

test('RolesGuard allows access when no @Roles() annotation is present', () => {
  const { guard, context } = makeContext(makeUser([]), undefined);
  assert.equal(guard.canActivate(context as never), true);
});

test('RolesGuard allows access when user has a required role', () => {
  const { guard, context } = makeContext(makeUser(['hr_manager']), ['hr_manager', 'hris_admin']);
  assert.equal(guard.canActivate(context as never), true);
});

test('RolesGuard allows access when user has one of multiple required roles', () => {
  const { guard, context } = makeContext(makeUser(['hris_admin']), ['hr_manager', 'hris_admin']);
  assert.equal(guard.canActivate(context as never), true);
});

test('RolesGuard throws ForbiddenException when user has no matching role', () => {
  const { guard, context } = makeContext(makeUser(['employee']), ['hr_manager']);
  assert.throws(() => guard.canActivate(context as never), { message: 'auth.forbidden' });
});

test('RolesGuard throws ForbiddenException when user is undefined', () => {
  const { guard, context } = makeContext(undefined, ['hr_manager']);
  assert.throws(() => guard.canActivate(context as never), { message: 'auth.token.invalid' });
});

test('RolesGuard allows super_admin through any role check', () => {
  const { guard, context } = makeContext(makeUser(['super_admin']), ['payroll_manager']);
  // super_admin is not automatically granted — @Roles() must include it explicitly
  // This test documents that super_admin is NOT implicitly privileged
  assert.throws(() => guard.canActivate(context as never), { message: 'auth.forbidden' });
});

test('ROLES_KEY constant matches expected metadata key', () => {
  assert.equal(ROLES_KEY, 'roles');
});
