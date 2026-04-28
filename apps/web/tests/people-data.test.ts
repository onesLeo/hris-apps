import assert from 'node:assert/strict';
import test from 'node:test';

import { EMPLOYEES, filterEmployees } from '../src/components/people/people-data.ts';

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
