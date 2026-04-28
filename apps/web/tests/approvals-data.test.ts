import assert from 'node:assert/strict';
import test from 'node:test';
import { APPROVALS } from '../src/components/approvals/approvals-data.ts';

test('approvals data contains the pending queue used by the dashboard and approvals screen', () => {
  assert.equal(APPROVALS.length, 5);
  assert.equal(APPROVALS[0]?.urgent, true);
  assert.equal(APPROVALS[1]?.dept, 'Sales');
});
