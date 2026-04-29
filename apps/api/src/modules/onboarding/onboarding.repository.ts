import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  CreateOnboardingCaseResult,
  HireCaseSnapshot,
  OnboardingCaseSnapshot,
  OnboardingDetailSnapshot,
  OnboardingTaskSnapshot,
  CompleteOnboardingTaskResult,
  TransitionOnboardingCaseResult,
} from './onboarding.types';

type EmployeeRow = {
  id: string;
  tenant_id: string;
  employee_number: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  status: string;
  hire_date: string;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  manager_display_name: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  location_id: string | null;
  location_name: string | null;
  employment_type: string | null;
  work_arrangement: string | null;
};

type HireCaseRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  status: HireCaseSnapshot['status'];
  start_date: string;
  context_json: unknown;
  hold_reason: string | null;
  cancel_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
};

type OnboardingCaseRow = {
  id: string;
  tenant_id: string;
  hire_case_id: string;
  employee_id: string;
  status: OnboardingCaseSnapshot['status'];
  start_date: string;
  current_task_order: number | null;
  activated_at: string | null;
  hold_reason: string | null;
  cancel_reason: string | null;
};

type OnboardingTaskRow = {
  id: string;
  tenant_id: string;
  onboarding_case_id: string;
  task_order: number;
  code: string;
  title: string;
  description: string | null;
  assignee_role: string;
  status: OnboardingTaskSnapshot['status'];
  required: boolean;
  due_date: string | null;
  completed_by: string | null;
  completed_at: string | null;
  comment: string | null;
};

@Injectable()
export class OnboardingRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async loadCreateSnapshot(tenantId: string, employeeId: string): Promise<{
    employee: EmployeeRow | null;
    openHireCase: HireCaseSnapshot | null;
    openOnboardingCase: OnboardingCaseSnapshot | null;
  }> {
    const [employee] = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT e.*,
        s.job_title,
        s.department_id,
        d.name AS department_name,
        s.location_id,
        l.name AS location_name,
        s.employment_type,
        s.work_arrangement,
        m.display_name AS manager_display_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations l ON l.id = s.location_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE e.id = $1 AND e.tenant_id = $2
    `, [employeeId, tenantId]);

    const [openHireCase] = await this.db.queryWithTenant<HireCaseRow>(tenantId, `
      SELECT id, tenant_id, employee_id, status, start_date, context_json, hold_reason, cancel_reason, approved_by, approved_at
      FROM hire_cases
      WHERE employee_id = $1 AND tenant_id = $2 AND status IN ('draft', 'pending_approval', 'approved', 'ready_for_start', 'on_hold')
      ORDER BY created_at DESC
      LIMIT 1
    `, [employeeId, tenantId]);

    const [openOnboardingCase] = await this.db.queryWithTenant<OnboardingCaseRow>(tenantId, `
      SELECT id, tenant_id, hire_case_id, employee_id, status, start_date, current_task_order, activated_at, hold_reason, cancel_reason
      FROM onboarding_cases
      WHERE employee_id = $1 AND tenant_id = $2 AND status IN ('draft', 'in_progress', 'ready_for_start', 'on_hold')
      ORDER BY created_at DESC
      LIMIT 1
    `, [employeeId, tenantId]);

    return {
      employee: employee ?? null,
      openHireCase: openHireCase
        ? {
            id: openHireCase.id,
            tenantId: openHireCase.tenant_id,
            employeeId: openHireCase.employee_id,
            status: openHireCase.status,
            startDate: openHireCase.start_date,
            contextJson: (openHireCase.context_json as Record<string, unknown>) ?? {},
            holdReason: openHireCase.hold_reason,
            cancelReason: openHireCase.cancel_reason,
            approvedBy: openHireCase.approved_by,
            approvedAt: openHireCase.approved_at,
          }
        : null,
      openOnboardingCase: openOnboardingCase
        ? {
            id: openOnboardingCase.id,
            tenantId: openOnboardingCase.tenant_id,
            hireCaseId: openOnboardingCase.hire_case_id,
            employeeId: openOnboardingCase.employee_id,
            status: openOnboardingCase.status,
            startDate: openOnboardingCase.start_date,
            currentTaskOrder: openOnboardingCase.current_task_order,
            activatedAt: openOnboardingCase.activated_at,
            holdReason: openOnboardingCase.hold_reason,
            cancelReason: openOnboardingCase.cancel_reason,
          }
        : null,
    };
  }

  async loadEmployeeDetail(tenantId: string, employeeId: string): Promise<OnboardingDetailSnapshot> {
    const createSnapshot = await this.loadCreateSnapshot(tenantId, employeeId);

    if (!createSnapshot.openOnboardingCase) {
      return {
        employee: createSnapshot.employee,
        hireCase: createSnapshot.openHireCase,
        onboardingCase: null,
        tasks: [],
        openHireCase: createSnapshot.openHireCase,
        openOnboardingCase: null,
      };
    }

    return this.loadCaseDetail(tenantId, createSnapshot.openOnboardingCase.id);
  }

  async loadCaseDetail(tenantId: string, onboardingCaseId: string): Promise<OnboardingDetailSnapshot> {
    const [onboardingCaseRow] = await this.db.queryWithTenant<OnboardingCaseRow>(tenantId, `
      SELECT id, tenant_id, hire_case_id, employee_id, status, start_date, current_task_order, activated_at, hold_reason, cancel_reason
      FROM onboarding_cases
      WHERE id = $1 AND tenant_id = $2
    `, [onboardingCaseId, tenantId]);

    if (!onboardingCaseRow) {
      return {
        employee: null,
        hireCase: null,
        onboardingCase: null,
        tasks: [],
        openHireCase: null,
        openOnboardingCase: null,
      };
    }

    const [employee] = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT e.*,
        s.job_title,
        s.department_id,
        d.name AS department_name,
        s.location_id,
        l.name AS location_name,
        s.employment_type,
        s.work_arrangement,
        m.display_name AS manager_display_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations l ON l.id = s.location_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE e.id = $1 AND e.tenant_id = $2
    `, [onboardingCaseRow.employee_id, tenantId]);

    const [hireCaseRow] = await this.db.queryWithTenant<HireCaseRow>(tenantId, `
      SELECT id, tenant_id, employee_id, status, start_date, context_json, hold_reason, cancel_reason, approved_by, approved_at
      FROM hire_cases
      WHERE id = $1 AND tenant_id = $2
    `, [onboardingCaseRow.hire_case_id, tenantId]);

    const taskRows = await this.db.queryWithTenant<OnboardingTaskRow>(tenantId, `
      SELECT id, tenant_id, onboarding_case_id, task_order, code, title, description,
        assignee_role, status, required, due_date, completed_by, completed_at, comment
      FROM onboarding_tasks
      WHERE onboarding_case_id = $1 AND tenant_id = $2
      ORDER BY task_order ASC
    `, [onboardingCaseRow.id, tenantId]);

    return {
      employee: employee ?? null,
      hireCase: hireCaseRow
        ? {
            id: hireCaseRow.id,
            tenantId: hireCaseRow.tenant_id,
            employeeId: hireCaseRow.employee_id,
            status: hireCaseRow.status,
            startDate: hireCaseRow.start_date,
            contextJson: (hireCaseRow.context_json as Record<string, unknown>) ?? {},
            holdReason: hireCaseRow.hold_reason,
            cancelReason: hireCaseRow.cancel_reason,
            approvedBy: hireCaseRow.approved_by,
            approvedAt: hireCaseRow.approved_at,
          }
        : null,
      onboardingCase: {
        id: onboardingCaseRow.id,
        tenantId: onboardingCaseRow.tenant_id,
        hireCaseId: onboardingCaseRow.hire_case_id,
        employeeId: onboardingCaseRow.employee_id,
        status: onboardingCaseRow.status,
        startDate: onboardingCaseRow.start_date,
        currentTaskOrder: onboardingCaseRow.current_task_order,
        activatedAt: onboardingCaseRow.activated_at,
        holdReason: onboardingCaseRow.hold_reason,
        cancelReason: onboardingCaseRow.cancel_reason,
      },
      tasks: taskRows.map((task) => ({
        id: task.id,
        tenantId: task.tenant_id,
        onboardingCaseId: task.onboarding_case_id,
        taskOrder: task.task_order,
        code: task.code,
        title: task.title,
        description: task.description,
        assigneeRole: task.assignee_role,
        status: task.status,
        required: task.required,
        dueDate: task.due_date,
        completedBy: task.completed_by,
        completedAt: task.completed_at,
        comment: task.comment,
      })),
      openHireCase: hireCaseRow
        ? {
            id: hireCaseRow.id,
            tenantId: hireCaseRow.tenant_id,
            employeeId: hireCaseRow.employee_id,
            status: hireCaseRow.status,
            startDate: hireCaseRow.start_date,
            contextJson: (hireCaseRow.context_json as Record<string, unknown>) ?? {},
            holdReason: hireCaseRow.hold_reason,
            cancelReason: hireCaseRow.cancel_reason,
            approvedBy: hireCaseRow.approved_by,
            approvedAt: hireCaseRow.approved_at,
          }
        : null,
      openOnboardingCase: {
        id: onboardingCaseRow.id,
        tenantId: onboardingCaseRow.tenant_id,
        hireCaseId: onboardingCaseRow.hire_case_id,
        employeeId: onboardingCaseRow.employee_id,
        status: onboardingCaseRow.status,
        startDate: onboardingCaseRow.start_date,
        currentTaskOrder: onboardingCaseRow.current_task_order,
        activatedAt: onboardingCaseRow.activated_at,
        holdReason: onboardingCaseRow.hold_reason,
        cancelReason: onboardingCaseRow.cancel_reason,
      },
    };
  }

  async saveCreateResult(
    tenantId: string,
    result: CreateOnboardingCaseResult,
  ): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          INSERT INTO hire_cases (
            id, tenant_id, employee_id, status, start_date, context_json,
            hold_reason, cancel_reason, approved_by, approved_at, created_by, created_at, updated_at
          ) VALUES (
            ${result.hireCase.id},
            ${result.hireCase.tenantId},
            ${result.hireCase.employeeId},
            ${result.hireCase.status},
            ${result.hireCase.startDate},
            ${result.hireCase.contextJson},
            ${result.hireCase.holdReason},
            ${result.hireCase.cancelReason},
            ${result.hireCase.approvedBy},
            ${result.hireCase.approvedAt},
            ${result.hireCase.approvedBy},
            ${result.hireCase.approvedAt},
            ${result.hireCase.approvedAt}
          )
        `);

        await tx.execute(sql`
          INSERT INTO onboarding_cases (
            id, tenant_id, hire_case_id, employee_id, status, start_date,
            current_task_order, activated_at, hold_reason, cancel_reason,
            created_by, created_at, updated_at
          ) VALUES (
            ${result.onboardingCase.id},
            ${result.onboardingCase.tenantId},
            ${result.onboardingCase.hireCaseId},
            ${result.onboardingCase.employeeId},
            ${result.onboardingCase.status},
            ${result.onboardingCase.startDate},
            ${result.onboardingCase.currentTaskOrder},
            ${result.onboardingCase.activatedAt},
            ${result.onboardingCase.holdReason},
            ${result.onboardingCase.cancelReason},
            ${result.hireCase.approvedBy},
            ${result.hireCase.approvedAt},
            ${result.hireCase.approvedAt}
          )
        `);

        for (const task of result.tasks) {
          await tx.execute(sql`
            INSERT INTO onboarding_tasks (
              id, tenant_id, onboarding_case_id, task_order, code, title,
              description, assignee_role, status, required, due_date,
              completed_by, completed_at, comment, created_at, updated_at
            ) VALUES (
              ${task.id},
              ${task.tenantId},
              ${task.onboardingCaseId},
              ${task.taskOrder},
              ${task.code},
              ${task.title},
              ${task.description},
              ${task.assigneeRole},
              ${task.status},
              ${task.required},
              ${task.dueDate},
              ${task.completedBy},
              ${task.completedAt},
              ${task.comment},
              ${result.hireCase.approvedAt},
              ${result.hireCase.approvedAt}
            )
          `);
        }
      });
    });
  }

  async saveTaskCompletion(
    tenantId: string,
    result: CompleteOnboardingTaskResult,
  ): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE onboarding_tasks
          SET
            status = ${result.task.status},
            completed_by = ${result.task.completedBy},
            completed_at = ${result.task.completedAt},
            comment = ${result.task.comment},
            updated_at = ${result.task.completedAt}
          WHERE id = ${result.task.id}
            AND onboarding_case_id = ${result.onboardingCase.id}
        `);

        await tx.execute(sql`
          UPDATE onboarding_cases
          SET
            status = ${result.onboardingCase.status},
            current_task_order = ${result.onboardingCase.currentTaskOrder},
            activated_at = ${result.onboardingCase.activatedAt},
            hold_reason = ${result.onboardingCase.holdReason},
            cancel_reason = ${result.onboardingCase.cancelReason},
            updated_at = ${result.task.completedAt}
          WHERE id = ${result.onboardingCase.id}
            AND tenant_id = ${tenantId}
        `);

        await tx.execute(sql`
          UPDATE hire_cases
          SET
            status = ${result.hireCase.status},
            hold_reason = ${result.hireCase.holdReason},
            cancel_reason = ${result.hireCase.cancelReason},
            approved_by = ${result.hireCase.approvedBy},
            approved_at = ${result.hireCase.approvedAt},
            updated_at = ${result.task.completedAt}
          WHERE id = ${result.hireCase.id}
            AND tenant_id = ${tenantId}
        `);
      });
    });
  }

  async saveTransitionResult(
    tenantId: string,
    result: TransitionOnboardingCaseResult,
  ): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE onboarding_cases
          SET
            status = ${result.onboardingCase.status},
            current_task_order = ${result.onboardingCase.currentTaskOrder},
            activated_at = ${result.onboardingCase.activatedAt},
            hold_reason = ${result.onboardingCase.holdReason},
            cancel_reason = ${result.onboardingCase.cancelReason},
            updated_at = ${new Date().toISOString()}
          WHERE id = ${result.onboardingCase.id}
            AND tenant_id = ${tenantId}
        `);

        await tx.execute(sql`
          UPDATE hire_cases
          SET
            status = ${result.hireCase.status},
            hold_reason = ${result.hireCase.holdReason},
            cancel_reason = ${result.hireCase.cancelReason},
            approved_by = ${result.hireCase.approvedBy},
            approved_at = ${result.hireCase.approvedAt},
            updated_at = ${new Date().toISOString()}
          WHERE id = ${result.hireCase.id}
            AND tenant_id = ${tenantId}
        `);

        if (result.employeeStatus === 'active') {
          await tx.execute(sql`
            UPDATE employees
            SET status = 'active', updated_at = ${new Date().toISOString()}
            WHERE id = ${result.onboardingCase.employeeId}
              AND tenant_id = ${tenantId}
          `);
        }
      });
    });
  }

  async activateEmployee(tenantId: string, employeeId: string, activatedAt: string): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.execute(sql`
        UPDATE employees
        SET status = 'active', updated_at = ${activatedAt}
        WHERE id = ${employeeId}
          AND tenant_id = ${tenantId}
      `);
    });
  }
}
