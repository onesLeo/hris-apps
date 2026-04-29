import assert from 'node:assert/strict';
import test from 'node:test';
import { getApprovalsData } from '../src/components/approvals/approvals-data.ts';

test('approvals data contains the pending queue used by the dashboard and approvals screen', () => {
  const english = getApprovalsData('en');
  const indonesian = getApprovalsData('id');

  assert.equal(english.length, 5);
  assert.equal(english[0]?.urgent, true);
  assert.equal(english[1]?.dept, 'Sales');
  assert.equal(indonesian[1]?.dept, 'Penjualan');
  assert.equal(indonesian[4]?.detail, 'React Advanced - Rp 499');
});
