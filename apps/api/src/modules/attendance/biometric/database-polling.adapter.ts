import type { IBiometricAdapter, RawClockPayload } from './biometric-adapter.interface';

export type DatabasePollingConfig = {
  deviceId: string;
  connectionString: string;
  tableName: string;
  timestampColumn: string;
  employeeColumn: string;
  directionColumn: string;
  lastSeenColumn: string;     // column used to watermark already-processed rows
  intervalSeconds: number;
};

/**
 * Database-polling adapter — connects to an external device database
 * (e.g. ZKTeco SDK DB) and reads new rows since the last watermark.
 *
 * NOTE: actual DB connection is injected at runtime; this class owns
 * the query-building and normalisation logic only.
 */
export class DatabasePollingAdapter implements IBiometricAdapter {
  readonly protocol = 'database_polling' as const;

  constructor(private readonly config: DatabasePollingConfig) {}

  buildQuery(since: Date): { sql: string; params: unknown[] } {
    const sql = `
      SELECT *
      FROM ${this.config.tableName}
      WHERE ${this.config.lastSeenColumn} > $1
      ORDER BY ${this.config.lastSeenColumn} ASC
      LIMIT 500
    `;
    return { sql, params: [since.toISOString()] };
  }

  normalise(row: Record<string, unknown>): RawClockPayload {
    const eventTime = String(row[this.config.timestampColumn] ?? new Date().toISOString());
    const employeeRef = String(row[this.config.employeeColumn] ?? '');
    const rawDir = String(row[this.config.directionColumn] ?? '').toLowerCase();
    const direction: RawClockPayload['direction'] =
      rawDir === 'in' || rawDir === '1' || rawDir === 'checkin' ? 'in'
        : rawDir === 'out' || rawDir === '0' || rawDir === 'checkout' ? 'out'
          : 'unknown';

    return { deviceId: this.config.deviceId, employeeRef, eventTime, direction, rawData: row };
  }
}
