import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { RawClockPayload } from './biometric-adapter.interface';

type EnrollmentRow = { employee_id: string; tenant_id: string };
type RawPayloadInsertRow = { id: string };

/**
 * Receives a normalised RawClockPayload from any adapter, stores the raw
 * payload for audit, resolves the employee via device_enrollments,
 * deduplicates within a 2-minute window, and inserts a clock_event.
 */
@Injectable()
export class BiometricIngestionService {
  private readonly logger = new Logger(BiometricIngestionService.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async ingest(tenantId: string, payload: RawClockPayload): Promise<void> {
    const rawId = await this.storeRawPayload(tenantId, payload);

    const enrollment = await this.resolveEmployee(tenantId, payload.deviceId, payload.employeeRef);
    if (!enrollment) {
      this.logger.warn(`No enrollment found for device=${payload.deviceId} ref=${payload.employeeRef}`);
      await this.markRawFailed(tenantId, rawId, `No enrollment for device ref ${payload.employeeRef}`);
      return;
    }

    const direction = payload.direction === 'unknown' ? 'in' : payload.direction;
    const isDuplicate = await this.isDuplicate(tenantId, enrollment.employee_id, payload.eventTime, direction);

    const [clockRow] = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      INSERT INTO clock_events (tenant_id, employee_id, event_time, direction, source, device_id, raw_payload, is_duplicate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      tenantId,
      enrollment.employee_id,
      payload.eventTime,
      direction,
      payload.rawData['source'] ?? 'biometric',
      payload.deviceId,
      JSON.stringify(payload.rawData),
      isDuplicate,
    ]);

    if (clockRow && !isDuplicate) {
      const workDate = payload.eventTime.slice(0, 10);
      await this.upsertAttendanceRecord(tenantId, enrollment.employee_id, workDate, direction, payload.eventTime);
      await this.markRawProcessed(tenantId, rawId, clockRow.id);
    }
  }

  private async storeRawPayload(tenantId: string, payload: RawClockPayload): Promise<string> {
    const [row] = await this.db.queryWithTenant<RawPayloadInsertRow>(tenantId, `
      INSERT INTO raw_clock_payloads (tenant_id, protocol, payload, received_at)
      VALUES ($1, 'webhook_push', $2, NOW())
      RETURNING id
    `, [tenantId, JSON.stringify(payload.rawData)]);

    return row?.id ?? '';
  }

  private async resolveEmployee(tenantId: string, deviceId: string, employeeRef: string): Promise<EnrollmentRow | null> {
    const rows = await this.db.queryWithTenant<EnrollmentRow>(tenantId, `
      SELECT de.employee_id, de.tenant_id
      FROM device_enrollments de
      JOIN biometric_devices bd ON bd.id = de.device_id
      WHERE de.tenant_id = $1
        AND (bd.serial_number = $2 OR bd.id::text = $2)
        AND (de.template_ref = $3 OR de.employee_id::text = $3)
        AND de.revoked_at IS NULL
      LIMIT 1
    `, [tenantId, deviceId, employeeRef]);

    return rows[0] ?? null;
  }

  private async isDuplicate(tenantId: string, employeeId: string, eventTime: string, direction: string): Promise<boolean> {
    const rows = await this.db.queryWithTenant<{ count: string }>(tenantId, `
      SELECT COUNT(*) AS count
      FROM clock_events
      WHERE tenant_id = $1
        AND employee_id = $2
        AND direction = $3
        AND ABS(EXTRACT(EPOCH FROM (event_time - $4::timestamptz))) < 120
        AND is_duplicate = FALSE
    `, [tenantId, employeeId, direction, eventTime]);

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async upsertAttendanceRecord(
    tenantId: string, employeeId: string, workDate: string,
    direction: 'in' | 'out', eventTime: string,
  ): Promise<void> {
    if (direction === 'in') {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_in, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET clock_in = EXCLUDED.clock_in, updated_at = NOW()
      `, [tenantId, employeeId, workDate, eventTime]);
    } else {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_out, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET
          clock_out = EXCLUDED.clock_out,
          worked_minutes = CASE
            WHEN attendance_records.clock_in IS NOT NULL
            THEN EXTRACT(EPOCH FROM ($4::timestamptz - attendance_records.clock_in)) / 60
            ELSE NULL
          END,
          updated_at = NOW()
      `, [tenantId, employeeId, workDate, eventTime]);
    }
  }

  private async markRawProcessed(tenantId: string, rawId: string, clockEventId: string): Promise<void> {
    if (!rawId) return;
    await this.db.queryWithTenant(tenantId, `
      UPDATE raw_clock_payloads SET clock_event_id = $1, processed_at = NOW() WHERE id = $2
    `, [clockEventId, rawId]);
  }

  private async markRawFailed(tenantId: string, rawId: string, reason: string): Promise<void> {
    if (!rawId) return;
    await this.db.queryWithTenant(tenantId, `
      UPDATE raw_clock_payloads SET error_message = $1, processed_at = NOW() WHERE id = $2
    `, [reason, rawId]);
  }
}
