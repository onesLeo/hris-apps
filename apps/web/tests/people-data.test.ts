import assert from 'node:assert/strict';
import test from 'node:test';

import { EMPLOYEES, addEmployee, filterEmployees, getEmployeeKey, removeEmployee, suspendEmployee, updateEmployee } from '../src/components/people/people-data.ts';

test('filterEmployees returns matching people for a status filter', () => {
  const result = filterEmployees(EMPLOYEES, 'On Leave', '');

  assert.equal(result.length, 2);
  assert.ok(result.every((employee) => employee.status === 'On Leave'));
});

test('filterEmployees supports search across name, role, and department', () => {
  const byName = filterEmployees(EMPLOYEES, 'All', 'sarah');
  const byRole = filterEmployees(EMPLOYEES, 'All', 'engineer');
  const byDept = filterEmployees(EMPLOYEES, 'All', 'finance');

  assert.deepEqual(byName.map((employee) => employee.name), ['Sarah Chen']);
  assert.ok(byRole.some((employee) => employee.name === 'Sarah Chen'));
  assert.ok(byDept.some((employee) => employee.name === 'Emma Williams'));
});

test('filterEmployees combines filter and search', () => {
  const result = filterEmployees(EMPLOYEES, 'Remote', 'devops');

  assert.deepEqual(result.map((employee) => employee.name), ['James Kim']);
});

test('addEmployee prepends a new employee with derived initials', () => {
  const next = addEmployee(EMPLOYEES, {
    name: 'Alex Lee',
    role: 'People Analyst',
    dept: 'People Ops',
    status: 'Active',
    type: 'Office',
    since: 'Apr 2026',
  });

  assert.equal(next.length, EMPLOYEES.length + 1);
  assert.equal(next[0]?.name, 'Alex Lee');
  assert.equal(next[0]?.initials, 'AL');
});

test('updateEmployee replaces a matching employee record', () => {
  const key = getEmployeeKey(EMPLOYEES[0]!);
  const next = updateEmployee(EMPLOYEES, key, {
    name: 'Sarah Chen',
    role: 'Principal Engineer',
    dept: 'Engineering',
    status: 'Active',
    type: 'Remote',
    since: 'Apr 2022',
  });

  assert.equal(next[0]?.role, 'Principal Engineer');
  assert.equal(next[0]?.initials, EMPLOYEES[0]?.initials);
});

test('suspendEmployee marks the matching employee as suspended', () => {
  const key = getEmployeeKey(EMPLOYEES[1]!);
  const next = suspendEmployee(EMPLOYEES, key);

  assert.equal(next[1]?.status, 'Suspended');
  assert.equal(next[1]?.color, '#64748b');
});

test('removeEmployee deletes the matching employee record', () => {
  const key = getEmployeeKey(EMPLOYEES[2]!);
  const next = removeEmployee(EMPLOYEES, key);

  assert.equal(next.length, EMPLOYEES.length - 1);
  assert.ok(next.every((employee) => getEmployeeKey(employee) !== key));
});
