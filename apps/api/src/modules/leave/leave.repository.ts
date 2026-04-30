import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { LeaveTypeSnapshot, LeaveBalanceSnapshot, LeaveRequestSnapshot } from './leave.types';
import type { CreateLeaveRequestDto } from './leave.dto';

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

@Injectable()
export class LeaveRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async findLeaveTypes(tenantId: string): Promise<LeaveTypeSnapshot[]> {
    const rows = await this.db.queryWithTenant<LeaveTypeRow>(tenantId, `
      SELECT id, tenant_id, name, code, is_paid, days_per_year, carry_over_days, requires_approval, is_active
      FROM leave_types
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      code: row.code,
      isPaid: row.is_paid,
      daysPerYear: row.days_per_year,
      carryOverDays: row.carry_over_days,
      requiresApproval: row.requires_approval,
      isActive: row.is_active,
    }));
  }

  async findLeaveBalances(tenantId: string, employeeId: string, year: number): Promise<LeaveBalanceSnapshot[]> {
    const rows = await this.db.queryWithTenant<LeaveBalanceRow>(tenantId, `
      SELECT lb.id, lb.tenant_id, lb.employee_id, lb.leave_type_id,
        lt.name AS leave_type_name, lt.code AS leave_type_code,
        lb.year, lb.entitled_days, lb.taken_days, lb.pending_days, lb.carried_over_days
      FROM leave_balances lb
      JOIN leave_types lt ON lt.id = lb.leave_type_id
      WHERE lb.tenant_id = $1 AND lb.employee_id = $2 AND lb.year = $3
      ORDER BY lt.name ASC
    `, [tenantId, employeeId, year]);

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      employeeId: row.employee_id,
      leaveTypeId: row.leave_type_id,
      leaveTypeName: row.leave_type_name,
      leaveTypeCode: row.leave_type_code,
      year: row.year,
      entitledDays: row.entitled_days,
      takenDays: row.taken_days,
      pendingDays: row.pending_days,
      carriedOverDays: row.carried_over_days,
      remainingDays: row.entitled_days + row.carried_over_days - row.taken_days - row.pending_days,
    }));
  }

  async findLeaveRequests(
    tenantId: string,
    filters: { employeeId?: string; status?: string; limit?: number },
  ): Promise<LeaveRequestSnapshot[]> {
    const conditions: string[] = ['lr.tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters.employeeId) {
      conditions.push(`lr.employee_id = $${idx++}`);
      params.push(filters.employeeId);
    }

    if (filters.status) {
      conditions.push(`lr.status = $${idx++}`);
      params.push(filters.status);
    }

    const limitClause = filters.limit ? `LIMIT $${idx++}` : 'LIMIT 100';
    if (filters.limit) {
      params.push(filters.limit);
    }

    const rows = await this.db.queryWithTenant<LeaveRequestRow>(tenantId, `
      SELECT lr.id, lr.tenant_id, lr.employee_id,
        e.display_name AS employee_name,
        lr.leave_type_id, lt.name AS leave_type_name,
        lr.from_date, lr.to_date, lr.days, lr.reason, lr.status,
        lr.reviewed_by, lr.reviewed_at, lr.review_note, lr.created_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY lr.created_at DESC
      ${limitClause}
    `, params);

    return rows.map(mapLeaveRequestRow);
  }

  async findLeaveRequestById(tenantId: string, id: string): Promise<LeaveRequestSnapshot | null> {
    const [row] = await this.db.queryWithTenant<LeaveRequestRow>(tenantId, `
      SELECT lr.id, lr.tenant_id, lr.employee_id,
        e.display_name AS employee_name,
        lr.leave_type_id, lt.name AS leave_type_name,
        lr.from_date, lr.to_date, lr.days, lr.reason, lr.status,
        lr.reviewed_by, lr.reviewed_at, lr.review_note, lr.created_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.id = $1 AND lr.tenant_id = $2
    `, [id, tenantId]);

    return row ? mapLeaveRequestRow(row) : null;
  }

  async createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto): Promise<LeaveRequestSnapshot> {
    const [row] = await this.db.queryWithTenant<LeaveRequestRow>(tenantId, `
      WITH inserted AS (
        INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, from_date, to_date, days, reason, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      )
      SELECT i.id, i.tenant_id, i.employee_id,
        e.display_name AS employee_name,
        i.leave_type_id, lt.name AS leave_type_name,
        i.from_date, i.to_date, i.days, i.reason, i.status,
        i.reviewed_by, i.reviewed_at, i.review_note, i.created_at
      FROM inserted i
      JOIN employees e ON e.id = i.employee_id
      JOIN leave_types lt ON lt.id = i.leave_type_id
    `, [tenantId, data.employeeId, data.leaveTypeId, data.fromDate, data.toDate, data.days, data.reason ?? null]);

    if (!row) {
      throw new Error('Failed to create leave request');
    }

    return mapLeaveRequestRow(row);
  }

  async updateLeaveRequestStatus(
    tenantId: string,
    id: string,
    status: 'approved' | 'rejected' | 'cancelled',
    reviewedBy: string,
    reviewNote: string | null,
  ): Promise<LeaveRequestSnapshot | null> {
    const [row] = await this.db.queryWithTenant<LeaveRequestRow>(tenantId, `
      WITH updated AS (
        UPDATE leave_requests
        SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3, updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5
        RETURNING *
      )
      SELECT u.id, u.tenant_id, u.employee_id,
        e.display_name AS employee_name,
        u.leave_type_id, lt.name AS leave_type_name,
        u.from_date, u.to_date, u.days, u.reason, u.status,
        u.reviewed_by, u.reviewed_at, u.review_note, u.created_at
      FROM updated u
      JOIN employees e ON e.id = u.employee_id
      JOIN leave_types lt ON lt.id = u.leave_type_id
    `, [status, reviewedBy, reviewNote, id, tenantId]);

    return row ? mapLeaveRequestRow(row) : null;
  }

  async adjustLeaveBalance(
    tenantId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
    deltaType: 'pending' | 'taken',
    delta: number,
  ): Promise<void> {
    const column = deltaType === 'pending' ? 'pending_days' : 'taken_days';
    await this.db.queryWithTenant(tenantId, `
      UPDATE leave_balances
      SET ${column} = ${column} + $1, updated_at = NOW()
      WHERE tenant_id = $2 AND employee_id = $3 AND leave_type_id = $4 AND year = $5
    `, [delta, tenantId, employeeId, leaveTypeId, year]);
  }
}

function mapLeaveRequestRow(row: LeaveRequestRow): LeaveRequestSnapshot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    leaveTypeId: row.leave_type_id,
    leaveTypeName: row.leave_type_name,
    fromDate: row.from_date,
    toDate: row.to_date,
    days: row.days,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    createdAt: row.created_at,
  };
}
