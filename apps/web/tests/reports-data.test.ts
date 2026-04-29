import assert from 'node:assert/strict';
import test from 'node:test';
import { getReportsOverview } from '../src/components/reports/reports-data.ts';

test('getReportsOverview returns the reporting snapshot', () => {
  const overview = getReportsOverview('en');
  const localized = getReportsOverview('id');

  assert.equal(overview.metrics.length, 4);
  assert.equal(overview.catalog.length, 4);
  assert.equal(overview.exports[0]?.status, 'Delivered');
  assert.equal(overview.scheduleNotes.length, 3);
  assert.equal(localized.metrics[1]?.label, 'Laporan Live');
  assert.equal(localized.exports[1]?.name, 'Ringkasan Absensi');
});
