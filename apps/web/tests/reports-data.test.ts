import assert from 'node:assert/strict';
import test from 'node:test';
import { getReportsOverview } from '../src/components/reports/reports-data.ts';

test('getReportsOverview returns the reporting snapshot', () => {
  const overview = getReportsOverview();

  assert.equal(overview.metrics.length, 4);
  assert.equal(overview.catalog.length, 4);
  assert.equal(overview.exports[0]?.status, 'Delivered');
  assert.equal(overview.scheduleNotes.length, 3);
});
