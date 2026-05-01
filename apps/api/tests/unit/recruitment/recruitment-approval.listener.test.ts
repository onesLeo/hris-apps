import assert from 'node:assert/strict';
import test from 'node:test';
import { RecruitmentApprovalListener } from '../../../src/modules/recruitment/services/recruitment-approval.listener.ts';

test('approval completion moves requisitions to open and emits the opened event', async () => {
  const requisitionUpdates: Array<{ tenantId: string; id: string; data: { status: 'open' | 'cancelled' } }> = [];
  const emitted: Array<{ event: string; payload: unknown }> = [];

  const listener = new RecruitmentApprovalListener(
    {
      update: async (tenantId: string, id: string, data: { status: 'open' | 'cancelled' }) => {
        requisitionUpdates.push({ tenantId, id, data });
        return {
          id,
          tenantId,
          title: 'Role',
          departmentId: 'dept-1',
          locationId: 'loc-1',
          hiringManagerId: 'manager-1',
          status: data.status,
          headcount: 1,
          filledCount: 0,
          description: null,
          requirements: null,
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        };
      },
    } as never,
    {
      update: async () => {
        throw new Error('offer repository should not be used in this test');
      },
    } as never,
    {
      emit: (event: string, payload: unknown) => {
        emitted.push({ event, payload });
      },
      on: () => undefined,
    } as never,
  );

  await listener.handleApprovalInstanceCompleted({
    tenantId: 'tenant-1',
    requestType: 'requisition_approval',
    entityType: 'job_requisition',
    entityId: 'requisition-1',
    status: 'approved',
    completedAt: '2026-05-01T00:00:00.000Z',
  });

  assert.deepEqual(requisitionUpdates, [
    { tenantId: 'tenant-1', id: 'requisition-1', data: { status: 'open' } },
  ]);
  assert.equal(emitted[0]?.event, 'recruitment.requisition.opened');
});

test('approval completion moves offers to approved or declined', async () => {
  const offerUpdates: Array<{ tenantId: string; id: string; data: { status: 'approved' | 'declined' } }> = [];

  const listener = new RecruitmentApprovalListener(
    {
      update: async () => {
        throw new Error('requisition repository should not be used in this test');
      },
    } as never,
    {
      update: async (tenantId: string, id: string, data: { status: 'approved' | 'declined' }) => {
        offerUpdates.push({ tenantId, id, data });
        return {
          id,
          tenantId,
          applicationId: 'application-1',
          baseSalary: 10000000,
          bonus: null,
          equity: null,
          otherBenefits: null,
          status: data.status,
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        };
      },
    } as never,
    {
      emit: () => undefined,
      on: () => undefined,
    } as never,
  );

  await listener.handleApprovalInstanceCompleted({
    tenantId: 'tenant-1',
    requestType: 'offer_approval',
    entityType: 'job_offer',
    entityId: 'offer-1',
    status: 'rejected',
    completedAt: '2026-05-01T00:00:00.000Z',
  });

  assert.deepEqual(offerUpdates, [
    { tenantId: 'tenant-1', id: 'offer-1', data: { status: 'declined' } },
  ]);
});
