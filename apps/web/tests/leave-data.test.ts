import test from 'node:test';
import assert from 'node:assert/strict';
import { addLeaveRequest, filterLeaveRequests, LEAVE_REQUESTS } from '../src/components/leave/leave-data.ts';

test('leave helper adds pending requests to the top of the list', () => {
  const result = addLeaveRequest(LEAVE_REQUESTS, {
    employee: 'Nadia Rahman',
    leaveType: 'Annual Leave',
    from: 'May 10',
    to: 'May 12',
    days: 3,
    reason: 'Wedding trip',
  });

  assert.equal(result[0]?.employee, 'Nadia Rahman');
  assert.equal(result[0]?.status, 'Pending');
  assert.equal(result[0]?.days, 3);
});

test('leave helper filters by status and search text', () => {
  const approved = filterLeaveRequests(LEAVE_REQUESTS, 'Approved', '');
  assert.equal(approved.length, 1);
  assert.equal(approved[0]?.employee, 'Marcus Johnson');

  const searched = filterLeaveRequests(LEAVE_REQUESTS, 'All', 'medical');
  assert.equal(searched.length, 1);
  assert.equal(searched[0]?.employee, 'Lucas Rivera');
});
