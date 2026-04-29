import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveWorkflowAssignee,
  shouldSkipDuplicateApprover,
  validateWorkflowTemplateSteps,
} from '../../../src/modules/approval/approval.workflow.ts';

test('resolves the direct manager assignee when the step requires it', () => {
  const assignee = resolveWorkflowAssignee(
    { stepOrder: 1, name: 'Manager review', assigneeRule: 'direct_manager' },
    { directManagerId: 'user-1' },
  );

  assert.equal(assignee, 'user-1');
});

test('returns null when no assignee exists for the rule', () => {
  const assignee = resolveWorkflowAssignee(
    { stepOrder: 1, name: 'Payroll review', assigneeRule: 'payroll_manager' },
    {},
  );

  assert.equal(assignee, null);
});

test('skips duplicate approvers', () => {
  assert.equal(shouldSkipDuplicateApprover('user-1', 'user-1'), true);
  assert.equal(shouldSkipDuplicateApprover('user-1', 'user-2'), false);
  assert.equal(shouldSkipDuplicateApprover(null, 'user-2'), false);
});

test('validates contiguous workflow steps', () => {
  const errors = validateWorkflowTemplateSteps([
    { stepOrder: 1, name: 'Manager review', assigneeRule: 'direct_manager' },
    { stepOrder: 2, name: 'HR review', assigneeRule: 'hr_manager' },
  ]);

  assert.deepEqual(errors, []);
});

test('rejects broken workflow step ordering', () => {
  const errors = validateWorkflowTemplateSteps([
    { stepOrder: 2, name: 'Manager review', assigneeRule: 'direct_manager' },
    { stepOrder: 2, name: 'HR review', assigneeRule: 'hr_manager' },
  ]);

  assert.ok(errors.some((error) => error.includes('duplicate stepOrder')));
  assert.ok(errors.some((error) => error.includes('contiguous sequence')));
});
