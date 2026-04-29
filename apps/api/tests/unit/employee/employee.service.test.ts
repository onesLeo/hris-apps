import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StructuredLoggerService } from '../../../src/common/logging/structured-logger.service.ts';
import { EncryptionService } from '../../../src/common/encryption/encryption.service.ts';
import { EmployeeService } from '../../../src/modules/employee/employee.service.ts';
import type { EmployeeRow } from '../../../src/modules/employee/employee.types.ts';

const TENANT = 'tenant-uuid';
const EMP_ID = 'emp-uuid-001';
const DEPT_ID = 'dept-uuid-001';
const LOC_ID  = 'loc-uuid-001';
const TODAY   = new Date().toISOString().slice(0, 10);

// Base employee row returned from DB queries
const BASE_ROW: EmployeeRow = {
  id: EMP_ID,
  tenant_id: TENANT,
  employee_number: 'EMP-001',
  user_id: null,
  first_name: 'Alice',
  last_name: 'Smith',
  display_name: 'Alice Smith',
  email: 'alice@example.com',
  phone: null,
  date_of_birth: null,
  gender: null,
  nationality: null,
  status: 'active',
  hire_date: TODAY,
  termination_date: null,
  created_at: TODAY,
  updated_at: TODAY,
  job_title: 'Engineer',
  department_id: DEPT_ID,
  department_name: 'Engineering',
  location_id: LOC_ID,
  location_name: 'Jakarta',
  employment_type: 'full_time',
  work_arrangement: 'office',
};

type Call = { sql: string; params: unknown[] };

function makeService(stubRows: EmployeeRow[] = [BASE_ROW]) {
  const calls: Call[] = [];
  let callIndex = 0;

  const mockDb = {
    queryWithTenant: async <T extends Record<string, unknown>>(
      _tid: string,
      sql: string,
      params: unknown[],
    ): Promise<T[]> => {
      calls.push({ sql: sql.trim(), params });
      // SELECT queries return stub rows; mutating queries return empty array
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT') ||
                       sql.trim().toUpperCase().startsWith('INSERT') && sql.includes('RETURNING');
      callIndex++;
      return (isSelect ? stubRows : []) as unknown as T[];
    },
  };

  const mockEncryption = new EncryptionService({ get: () => 'a'.repeat(64), getOrThrow: () => 'a'.repeat(64) } as never);
  mockEncryption.onModuleInit();
  const mockLogger = new StructuredLoggerService();
  const mockEvents = new EventEmitter2();

  const emitted: Array<{ event: string; payload: unknown }> = [];
  mockEvents.onAny((event, payload) => emitted.push({ event: event as string, payload }));

  const svc = new EmployeeService(mockDb as never, mockEncryption, mockEvents, mockLogger);
  return { svc, calls, emitted };
}

// ─── hire ────────────────────────────────────────────────────────────────────

test('hire inserts employee, spell, lifecycle event and emits domain event', async () => {
  const { svc, calls, emitted } = makeService([BASE_ROW]);

  const result = await svc.hire(TENANT, {
    employeeNumber: 'EMP-001',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    hireDate: TODAY,
    jobTitle: 'Engineer',
    departmentId: DEPT_ID,
    locationId: LOC_ID,
  });

  assert.equal(result.id, EMP_ID);
  assert.equal(result.display_name, 'Alice Smith');

  // INSERT employee, INSERT spell, INSERT lifecycle event, SELECT for getById
  assert.ok(calls.length >= 3);
  assert.ok(calls[0]?.sql.includes('INSERT INTO employees'));
  assert.ok(calls[1]?.sql.includes('INSERT INTO employment_spells'));
  assert.ok(calls[2]?.sql.includes('INSERT INTO employee_lifecycle_events'));

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0]?.event, 'employee.hired');
});

// ─── list ─────────────────────────────────────────────────────────────────────

test('list returns data array with nextCursor null when results fit within limit', async () => {
  const { svc } = makeService([BASE_ROW]);

  const result = await svc.list(TENANT, { limit: 20 });

  assert.ok(Array.isArray(result.data));
  assert.equal(result.nextCursor, null);
});

test('list returns nextCursor when there are more results than the limit', async () => {
  // Return limit+1 rows to trigger pagination
  const manyRows = Array.from({ length: 21 }, (_, i) => ({ ...BASE_ROW, id: `emp-${i}` }));
  const { svc } = makeService(manyRows);

  const result = await svc.list(TENANT, { limit: 20 });

  assert.equal(result.data.length, 20);
  assert.ok(result.nextCursor !== null);
});

// ─── getById ─────────────────────────────────────────────────────────────────

test('getById returns employee when found', async () => {
  const { svc } = makeService([BASE_ROW]);
  const emp = await svc.getById(TENANT, EMP_ID);
  assert.equal(emp.id, EMP_ID);
});

test('getById throws NotFoundException when employee does not exist', async () => {
  const { svc } = makeService([]); // empty result
  await assert.rejects(
    () => svc.getById(TENANT, 'nonexistent'),
    (err: Error) => err.constructor.name === 'NotFoundException',
  );
});

// ─── update ──────────────────────────────────────────────────────────────────

test('update rebuilds display_name when first or last name changes', async () => {
  const { svc, calls } = makeService([BASE_ROW]);

  await svc.update(TENANT, EMP_ID, { firstName: 'Bob' });

  const updateCall = calls.find((c) => c.sql.includes('UPDATE employees'));
  assert.ok(updateCall, 'expected UPDATE employees call');
  // display_name param should be Bob Smith
  assert.ok(updateCall.params.some((p) => p === 'Bob Smith'));
});

test('update returns current record unchanged when no fields provided', async () => {
  const { svc, calls } = makeService([BASE_ROW]);
  const result = await svc.update(TENANT, EMP_ID, {});
  assert.equal(result.id, EMP_ID);
  // Should not have issued an UPDATE
  assert.ok(!calls.some((c) => c.sql.includes('UPDATE employees')));
});

// ─── transfer ─────────────────────────────────────────────────────────────────

test('transfer closes current spell and opens a new one', async () => {
  const { svc, calls, emitted } = makeService([BASE_ROW]);
  const NEW_DEPT = 'dept-uuid-002';
  const NEW_LOC  = 'loc-uuid-002';

  await svc.transfer(TENANT, EMP_ID, {
    departmentId: NEW_DEPT,
    locationId: NEW_LOC,
    effectiveDate: TODAY,
  });

  const closeSpell = calls.find((c) => c.sql.includes('UPDATE employment_spells'));
  const openSpell  = calls.find((c) => c.sql.includes('INSERT INTO employment_spells'));
  assert.ok(closeSpell, 'expected UPDATE employment_spells to close current spell');
  assert.ok(openSpell,  'expected INSERT INTO employment_spells to open new spell');

  assert.equal(emitted[0]?.event, 'employee.transferred');
  const payload = emitted[0]?.payload as Record<string, unknown>;
  assert.equal(payload['toDepartmentId'], NEW_DEPT);
});

// ─── suspend ─────────────────────────────────────────────────────────────────

test('suspend sets status to suspended and records lifecycle event', async () => {
  const { svc, calls } = makeService([BASE_ROW]);
  await svc.suspend(TENANT, EMP_ID);

  const updateCall = calls.find((c) => c.sql.includes('UPDATE employees'));
  assert.ok(updateCall, 'expected UPDATE employees call');
  // 'suspended' is hardcoded in the SQL string, not a bind parameter
  assert.ok(updateCall.sql.includes("'suspended'"), "SQL should set status = 'suspended'");
});

// ─── terminate ───────────────────────────────────────────────────────────────

test('terminate sets status to terminated and emits domain event', async () => {
  const { svc, calls, emitted } = makeService([BASE_ROW]);
  await svc.terminate(TENANT, EMP_ID, { terminationDate: TODAY });

  const updateCall = calls.find((c) => c.sql.includes('UPDATE employees'));
  assert.ok(updateCall);
  assert.ok(updateCall.sql.includes("'terminated'"), "SQL should set status = 'terminated'");
  assert.equal(emitted[0]?.event, 'employee.terminated');
});

// ─── upsertTaxProfile ─────────────────────────────────────────────────────────

test('upsertTaxProfile encrypts NPWP before storing', async () => {
  const { svc, calls } = makeService([]);
  await svc.upsertTaxProfile(TENANT, EMP_ID, '12.345.678.9-000.000', null);

  const insertCall = calls.find((c) => c.sql.includes('employee_tax_profiles'));
  assert.ok(insertCall, 'expected INSERT INTO employee_tax_profiles');
  // The raw NPWP should NOT appear in params — only the encrypted form
  const npwpParam = insertCall.params[2];
  assert.notEqual(npwpParam, '12.345.678.9-000.000', 'NPWP must be encrypted before storage');
  assert.ok(typeof npwpParam === 'string' && npwpParam.includes('.'), 'encrypted value should be base64.base64.base64 format');
});

test('upsertTaxProfile stores null when NPWP is null', async () => {
  const { svc, calls } = makeService([]);
  await svc.upsertTaxProfile(TENANT, EMP_ID, null, null);

  const insertCall = calls.find((c) => c.sql.includes('employee_tax_profiles'));
  assert.ok(insertCall);
  assert.equal(insertCall.params[2], null);
});

// ─── addBankAccount ───────────────────────────────────────────────────────────

test('addBankAccount encrypts account number before storing', async () => {
  const { svc, calls } = makeService([]);
  await svc.addBankAccount(TENANT, EMP_ID, 'BCA', '1234567890', 'Alice Smith', true);

  const insertCall = calls.find((c) => c.sql.includes('INSERT INTO employee_bank_accounts'));
  assert.ok(insertCall, 'expected INSERT INTO employee_bank_accounts');
  const accountParam = insertCall.params[3];
  assert.notEqual(accountParam, '1234567890', 'account number must be encrypted');
});

test('addBankAccount clears other primary accounts when isPrimary is true', async () => {
  const { svc, calls } = makeService([]);
  await svc.addBankAccount(TENANT, EMP_ID, 'BCA', '1234567890', 'Alice Smith', true);

  const clearCall = calls.find(
    (c) => c.sql.includes('UPDATE employee_bank_accounts') && c.sql.includes('is_primary = FALSE'),
  );
  assert.ok(clearCall, 'expected UPDATE to clear existing primary account');
});
