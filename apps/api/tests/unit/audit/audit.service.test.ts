import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestContext } from '../../../src/common/context/request-context.ts';
import { AuditService } from '../../../src/modules/audit/audit.service.ts';

function makeService() {
  const logged: unknown[] = [];
  const mockLogger = {
    log: (msg: unknown) => logged.push(msg),
    warn: (msg: unknown) => logged.push({ warn: msg }),
  };
  const svc = new AuditService();
  // Replace the internal logger with a spy via Object.assign
  Object.assign(svc, { logger: mockLogger });
  return { svc, logged };
}

test('AuditService.record() warns and does nothing outside request context', () => {
  const { svc, logged } = makeService();
  svc.record({ module: 'TestModule', action: 'create', entityType: 'employee' });
  assert.equal(logged.length, 1);
  assert.ok(JSON.stringify(logged[0]).includes('tenant context'));
});

test('AuditService.record() logs audit entry when tenant context is present', () => {
  const { svc, logged } = makeService();

  RequestContext.run({ requestId: 'req-1', tenantId: 'tenant-1', userId: 'user-1' }, () => {
    svc.record({
      module: 'EmployeeModule',
      action: 'create',
      entityType: 'employee',
      entityId: 'emp-1',
    });
  });

  assert.equal(logged.length, 1);
  const entry = logged[0] as Record<string, unknown>;
  assert.equal(entry['action'], 'create');
  assert.equal(entry['entity_type'], 'employee');
  assert.equal(entry['entity_id'], 'emp-1');
});

test('AuditService.record() includes changesJson when provided', () => {
  const { svc, logged } = makeService();

  RequestContext.run({ requestId: 'req-2', tenantId: 'tenant-1' }, () => {
    svc.record({
      module: 'LeaveModule',
      action: 'approve',
      entityType: 'leave_request',
      entityId: 'lr-1',
      changesJson: { status: { from: 'pending', to: 'approved' } },
    });
  });

  const entry = logged[0] as Record<string, unknown>;
  assert.deepEqual(entry['changes'], { status: { from: 'pending', to: 'approved' } });
});
