import assert from 'node:assert/strict';
import test from 'node:test';

import { RequestContext } from '../../../src/common/context/request-context.ts';
import { LeaveController } from '../../../src/modules/leave/leave.controller.ts';
import { LeaveRepository } from '../../../src/modules/leave/leave.repository.ts';
import { LeaveService } from '../../../src/modules/leave/leave.service.ts';
import { SubmitLeaveRequestUseCase } from '../../../src/modules/leave/submit-leave-request.use-case.ts';
import type { CreateLeaveRequestDto } from '../../../src/modules/leave/leave.dto.ts';
import type { LeaveBalanceSnapshot, LeaveRequestSnapshot, LeaveTypeSnapshot } from '../../../src/modules/leave/leave.types.ts';

const TENANT_ID = 'tenant-pilot';
const USER_ID = 'dev-employee';
const REQUEST_ID = 'pilot-leave-flow';
const EMPLOYEE_ID = 'employee-1';
const LEAVE_TYPE_ID = 'leave-type-1';
const WORKFLOW_INSTANCE_ID = 'workflow-1';
const REQUEST_DATE = '2026-05-02';

type LeaveTypeRow = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  is_paid: boolean;
  days_per_year: number | null;
  carry_over_days: number;
  requires_approval: boolean;
  is_active: boolean;
};

type LeaveBalanceRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type_name: string;
  leave_type_code: string;
  year: number;
  entitled_days: number;
  taken_days: number;
  pending_days: number;
  carried_over_days: number;
};

type LeaveRequestRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  leave_type_id: string;
  leave_type_name: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: LeaveRequestSnapshot['status'];
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

type Store = {
  leaveTypes: Map<string, LeaveTypeRow>;
  leaveBalances: Map<string, LeaveBalanceRow>;
  leaveRequests: Map<string, LeaveRequestRow>;
  workflowTemplates: Array<{ id: string; steps_json: unknown }>;
  workflowInstances: Array<{ id: string; contextJson: Record<string, unknown> }>;
  workflowSteps: Array<{ workflowInstanceId: string; stepOrder: number; stepType: string; assigneeId: string | null; status: string }>;
  updatedBalances: Array<{ tenantId: string; employeeId: string; leaveTypeId: string; year: number; column: 'pending' | 'taken'; delta: number }>;
  requestIdCounter: number;
};

function createStore(): Store {
  return {
    leaveTypes: new Map([
      [LEAVE_TYPE_ID, {
        id: LEAVE_TYPE_ID,
        tenant_id: TENANT_ID,
        name: 'Annual Leave',
        code: 'AL',
        is_paid: true,
        days_per_year: 12,
        carry_over_days: 6,
        requires_approval: true,
        is_active: true,
      }],
    ]),
    leaveBalances: new Map([
      [`${EMPLOYEE_ID}::${LEAVE_TYPE_ID}::2026`, {
        id: 'balance-1',
        tenant_id: TENANT_ID,
        employee_id: EMPLOYEE_ID,
        leave_type_id: LEAVE_TYPE_ID,
        leave_type_name: 'Annual Leave',
        leave_type_code: 'AL',
        year: 2026,
        entitled_days: 12,
        taken_days: 0,
        pending_days: 0,
        carried_over_days: 0,
      }],
    ]),
    leaveRequests: new Map(),
    workflowTemplates: [
      {
        id: 'template-1',
        steps_json: [
          { step_order: 1, step_type: 'manager_review', assignee_id: 'manager-1' },
        ],
      },
    ],
    workflowInstances: [],
    workflowSteps: [],
    updatedBalances: [],
    requestIdCounter: 0,
  };
}

function nextIdFactory() {
  let counter = 0;
  return (prefix: string) => `${prefix}-${String(++counter).padStart(2, '0')}`;
}

function balanceKey(employeeId: string, leaveTypeId: string, year: number): string {
  return `${employeeId}::${leaveTypeId}::${year}`;
}

class FakeLeaveDb {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async queryWithTenant<T>(tenantId: string, sql: string, params: unknown[]): Promise<T[]> {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    if (normalized.includes('SELECT requires_approval FROM leave_types')) {
      const leaveTypeId = String(params[0] ?? '');
      const leaveType = this.store.leaveTypes.get(leaveTypeId);
      if (!leaveType || leaveType.tenant_id !== tenantId) {
        return [];
      }
      return [{ requires_approval: leaveType.requires_approval } as T];
    }

    if (normalized.includes('SELECT id, steps_json FROM workflow_templates')) {
      return this.store.workflowTemplates.slice(0, 1).map((template) => ({
        id: template.id,
        steps_json: template.steps_json,
      }) as T);
    }

    if (normalized.includes('INSERT INTO workflow_instances')) {
      const contextJson = JSON.parse(String(params[6] ?? '{}')) as Record<string, unknown>;
      this.store.workflowInstances.push({
        id: WORKFLOW_INSTANCE_ID,
        contextJson,
      });
      return [{ id: WORKFLOW_INSTANCE_ID } as T];
    }

    if (normalized.includes('INSERT INTO workflow_step_instances')) {
      const [workflowInstanceId, stepOrder, stepType, assigneeId, status] = params.slice(0, 5) as [string, number, string, string | null, string];
      this.store.workflowSteps.push({
        workflowInstanceId,
        stepOrder: Number(stepOrder),
        stepType,
        assigneeId,
        status,
      });
      return [];
    }

    if (normalized.includes('SELECT id, tenant_id, name, code, is_paid, days_per_year, carry_over_days, requires_approval, is_active FROM leave_types')) {
      return [...this.store.leaveTypes.values()]
        .filter((leaveType) => leaveType.tenant_id === tenantId && leaveType.is_active)
        .map((leaveType) => leaveType as T);
    }

    if (normalized.includes('SELECT lb.id, lb.tenant_id, lb.employee_id, lb.leave_type_id')) {
      const employeeId = String(params[1] ?? '');
      const year = Number(params[2] ?? 0);
      return [...this.store.leaveBalances.values()]
        .filter((balance) => balance.tenant_id === tenantId && balance.employee_id === employeeId && balance.year === year)
        .map((balance) => balance as T);
    }

    if (normalized.includes('SELECT lr.id, lr.tenant_id, lr.employee_id')) {
      if (normalized.includes('WHERE lr.id = $1 AND lr.tenant_id = $2')) {
        const requestId = String(params[0] ?? '');
        const request = this.store.leaveRequests.get(requestId);
        if (!request || request.tenant_id !== tenantId) {
          return [];
        }
        return [request as T];
      }

      const employeeId = params[1] ? String(params[1]) : undefined;
      const status = params[2] ? String(params[2]) : undefined;
      const limit = params[3] ? Number(params[3]) : 100;
      return [...this.store.leaveRequests.values()]
        .filter((request) => request.tenant_id === tenantId)
        .filter((request) => !employeeId || request.employee_id === employeeId)
        .filter((request) => !status || request.status === status)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((request) => request as T);
    }

    if (normalized.includes('WITH inserted AS ( INSERT INTO leave_requests')) {
      const [employeeId, leaveTypeId, workflowInstanceId, fromDate, toDate, days, reason] = params.slice(1) as [string, string, string | null, string, string, number, string | null];
      const leaveType = this.store.leaveTypes.get(leaveTypeId);
      const request: LeaveRequestRow = {
        id: this.nextId('leave-request'),
        tenant_id: tenantId,
        employee_id: employeeId,
        employee_name: 'Siti Aminah',
        leave_type_id: leaveTypeId,
        leave_type_name: leaveType?.name ?? 'Annual Leave',
        from_date: fromDate,
        to_date: toDate,
        days: Number(days),
        reason: reason ?? null,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: '2026-05-02T00:00:00.000Z',
      };
      this.store.leaveRequests.set(request.id, request);
      return [request as T];
    }

    if (normalized.includes('UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3, updated_at = NOW()')) {
      const [status, reviewedBy, reviewNote, requestId] = params.slice(0, 4) as ['approved' | 'rejected' | 'cancelled', string, string | null, string];
      const request = this.store.leaveRequests.get(requestId);
      if (!request || request.tenant_id !== tenantId) {
        return [];
      }
      request.status = status;
      request.reviewed_by = reviewedBy;
      request.review_note = reviewNote ?? null;
      request.reviewed_at = '2026-05-02T00:00:00.000Z';
      return [request as T];
    }

    if (normalized.includes('UPDATE leave_balances SET pending_days = pending_days + $1')) {
      const [delta, , employeeId, leaveTypeId, year] = params as [number, string, string, string, number];
      this.store.updatedBalances.push({ tenantId, employeeId, leaveTypeId, year, column: 'pending', delta: Number(delta) });
      const key = balanceKey(employeeId, leaveTypeId, year);
      const balance = this.store.leaveBalances.get(key);
      if (balance) {
        balance.pending_days += Number(delta);
      }
      return [];
    }

    if (normalized.includes('UPDATE leave_balances SET taken_days = taken_days + $1')) {
      const [delta, , employeeId, leaveTypeId, year] = params as [number, string, string, string, number];
      this.store.updatedBalances.push({ tenantId, employeeId, leaveTypeId, year, column: 'taken', delta: Number(delta) });
      const key = balanceKey(employeeId, leaveTypeId, year);
      const balance = this.store.leaveBalances.get(key);
      if (balance) {
        balance.taken_days += Number(delta);
      }
      return [];
    }

    throw new Error(`Unexpected SQL in leave pilot test: ${sql}`);
  }
}

test('pilot flow: authenticated leave request is submitted and approved end to end', async () => {
  const store = createStore();
  const nextId = nextIdFactory();
  const db = new FakeLeaveDb(store, nextId);
  const repository = new LeaveRepository(db as never);
  const useCase = new SubmitLeaveRequestUseCase(db as never, repository);
  const service = new LeaveService(repository, useCase);
  const controller = new LeaveController(service, {
    runAnnualAccrual: async () => [],
    runAccrualForEmployee: async () => [],
  } as never);

  await RequestContext.run(
    {
      requestId: REQUEST_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      actorRole: 'employee',
    },
    async () => {
      const leaveTypes = await controller.listTypes();
      assert.equal(leaveTypes.length, 1);
      assert.equal(leaveTypes[0]?.id, LEAVE_TYPE_ID);

      const submitted = await controller.submitRequest({
        employeeId: EMPLOYEE_ID,
        leaveTypeId: LEAVE_TYPE_ID,
        fromDate: REQUEST_DATE,
        toDate: REQUEST_DATE,
        days: 1,
        reason: 'Medical appointment',
      });

      assert.equal(submitted.status, 'pending');
      assert.equal(submitted.leaveTypeId, LEAVE_TYPE_ID);

      const balancesAfterSubmit = await controller.listBalances(EMPLOYEE_ID, '2026');
      assert.equal(balancesAfterSubmit.length, 1);
      assert.equal(balancesAfterSubmit[0]?.pendingDays, 1);
      assert.equal(balancesAfterSubmit[0]?.remainingDays, 11);

      const requestsBeforeReview = await controller.listRequests(EMPLOYEE_ID, 'pending', '10');
      assert.equal(requestsBeforeReview.length, 1);

      await RequestContext.run(
        {
          requestId: `${REQUEST_ID}-review`,
          tenantId: TENANT_ID,
          userId: 'dev-hr-manager',
          actorRole: 'hr_manager',
        },
        async () => {
          const reviewed = await controller.reviewRequest(submitted.id, {
            action: 'approve',
            note: 'Approved for pilot test',
          });

          assert.equal(reviewed.status, 'approved');
        },
      );

      const balancesAfterReview = await controller.listBalances(EMPLOYEE_ID, '2026');
      assert.equal(balancesAfterReview[0]?.pendingDays, 0);
      assert.equal(balancesAfterReview[0]?.takenDays, 1);
      assert.equal(balancesAfterReview[0]?.remainingDays, 11);
    },
  );

  assert.equal(store.workflowInstances.length, 1);
  assert.equal(store.workflowSteps.length, 1);
  assert.equal(store.updatedBalances.length, 3);
});
