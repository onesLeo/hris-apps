import assert from 'node:assert/strict';
import test from 'node:test';
import { ApprovalDecisionError } from '../../../src/modules/approval/decide-approval-step.use-case.ts';
import { mapApprovalDecisionError } from '../../../src/modules/approval/approval-error.mapper.ts';

test('maps approval domain errors into HTTP exceptions with stable codes', () => {
  const error = new ApprovalDecisionError('ACTOR_NOT_ASSIGNED', 'actor is not assigned to this workflow step');
  const mapped = mapApprovalDecisionError(error);
  const response = mapped.getResponse() as { code?: string };

  assert.equal(mapped.getStatus(), 403);
  assert.equal(response.code, 'approval.step.not_assignee');
});

test('maps missing delegatee to bad request', () => {
  const error = new ApprovalDecisionError('MISSING_DELEGATEE', 'delegatedTo is required when delegating a step');
  const mapped = mapApprovalDecisionError(error);

  assert.equal(mapped.getStatus(), 400);
});
