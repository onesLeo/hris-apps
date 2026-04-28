import assert from 'node:assert/strict';
import test from 'node:test';
import { getAttendanceOverview } from '../src/components/attendance/attendance-data.ts';

test('getAttendanceOverview returns the attendance snapshot', () => {
  const overview = getAttendanceOverview();

  assert.equal(overview.metrics.length, 4);
  assert.equal(overview.shifts.length, 4);
  assert.equal(overview.events[0]?.action, 'Clock In');
  assert.equal(overview.notes.length, 3);
});
