import assert from 'node:assert/strict';
import test from 'node:test';
import { ApprovalService } from '../../../src/modules/approval/approval.service.ts';
import {
  WorkflowInstanceService,
  type StartWorkflowInstanceInput,
} from '../../../src/modules/approval/workflow-instance.service.ts';
import type { IDatabaseService } from '../../../src/common/database/database.types.ts';

function makeDb() {
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  const db: IDatabaseService = {
    queryWithTenant: async (_tenantId, sql, params = []) => {
      calls.push({ sql, params });

      if (sql.includes('SELECT id, steps_json') && sql.includes('FROM workflow_templates')) {
        return [];
      }

      if (sql.includes('INSERT INTO workflow_templates')) {
        return [
          {
            id: 'template-1',
            steps_json: [
              { stepOrder: 1, name: 'Hiring manager review', assigneeRule: 'direct_manager' },
              { stepOrder: 2, name: 'HR review', assigneeRule: 'hr_manager' },
            ],
          },
        ];
      }

      if (sql.includes('FROM user_roles ur')) {
        return [{ id: 'hr-user-1' }];
      }

      if (sql.includes('INSERT INTO workflow_instances')) {
        return [{ id: 'workflow-1' }];
      }

      if (sql.includes('INSERT INTO workflow_step_instances')) {
        return [];
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
    withTenant: async () => {
      throw new Error('withTenant is not used in this test');
    },
    system: {} as never,
  };

  return { db, calls };
}

test('starts a recruitment workflow instance with resolved assignees', async () => {
  const { db, calls } = makeDb();
  const service = new WorkflowInstanceService(db as never, new ApprovalService());

  const input: StartWorkflowInstanceInput = {
    templateCode: 'recruitment-offer-approval',
    templateName: 'Recruitment Offer Approval',
    requestType: 'offer_approval',
    entityType: 'job_offer',
    entityId: 'offer-1',
    requestorId: 'user-1',
    triggerEvent: 'recruitment.offer.submitted',
    defaultSteps: [
      { stepOrder: 1, name: 'Hiring manager review', assigneeRule: 'direct_manager' },
      { stepOrder: 2, name: 'HR review', assigneeRule: 'hr_manager' },
    ],
    assigneeContext: {
      directManagerId: 'manager-1',
    },
    contextJson: {
      offerId: 'offer-1',
    },
  };

  const workflowInstanceId = await service.startWorkflowInstance('tenant-1', input);

  assert.equal(workflowInstanceId, 'workflow-1');
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO workflow_instances')));
  const stepInserts = calls.filter((call) => call.sql.includes('INSERT INTO workflow_step_instances'));
  assert.equal(stepInserts.length, 2);
  assert.equal(stepInserts[0]?.params[3], 'manager-1');
  assert.equal(stepInserts[1]?.params[3], 'hr-user-1');
});

test('fails fast when no assignee can be resolved for a workflow step', async () => {
  const db: IDatabaseService = {
    queryWithTenant: async (_tenantId, sql) => {
      if (sql.includes('SELECT id, steps_json') && sql.includes('FROM workflow_templates')) {
        return [];
      }

      if (sql.includes('INSERT INTO workflow_templates')) {
        return [
          {
            id: 'template-1',
            steps_json: [
              { stepOrder: 1, name: 'Hiring manager review', assigneeRule: 'direct_manager' },
            ],
          },
        ];
      }

      return [];
    },
    withTenant: async () => {
      throw new Error('withTenant is not used in this test');
    },
    system: {} as never,
  };

  const service = new WorkflowInstanceService(db as never, new ApprovalService());

  await assert.rejects(
    () => service.startWorkflowInstance('tenant-1', {
      templateCode: 'recruitment-requisition-approval',
      templateName: 'Recruitment Requisition Approval',
      requestType: 'requisition_approval',
      entityType: 'job_requisition',
      entityId: 'requisition-1',
      requestorId: 'user-1',
      triggerEvent: 'recruitment.requisition.submitted',
      defaultSteps: [
        { stepOrder: 1, name: 'Hiring manager review', assigneeRule: 'direct_manager' },
      ],
    }),
    /No assignee could be resolved/,
  );
});
