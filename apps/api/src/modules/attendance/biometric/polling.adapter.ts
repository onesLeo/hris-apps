import type { IBiometricAdapter, RawClockPayload } from './biometric-adapter.interface';

export type PollingAdapterConfig = {
  deviceId: string;
  url: string;
  apiKey?: string;
  /** Seconds between polls — used externally by the scheduler. */
  intervalSeconds: number;
};

/**
 * HTTP-polling adapter — periodically GET a device's /events endpoint,
 * normalise each record, and return the batch.
 */
export class PollingAdapter implements IBiometricAdapter {
  readonly protocol = 'polling' as const;

  constructor(private readonly config: PollingAdapterConfig) {}

  async poll(): Promise<RawClockPayload[]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const resp = await fetch(this.config.url, { headers });
    if (!resp.ok) {
      throw new Error(`Polling adapter HTTP ${resp.status} from ${this.config.url}`);
    }

    const body = await resp.json() as unknown;
    const records = Array.isArray(body) ? body : (body as any).records ?? [];

    return (records as Record<string, unknown>[]).map((record) =>
      this.normalise(record),
    );
  }

  private normalise(record: Record<string, unknown>): RawClockPayload {
    const eventTime = String(record.timestamp ?? record.event_time ?? new Date().toISOString());
    const employeeRef = String(record.employee_id ?? record.user_id ?? record.badge_no ?? '');
    const rawDir = String(record.direction ?? record.type ?? '').toLowerCase();
    const direction: RawClockPayload['direction'] =
      rawDir === 'in' || rawDir === '1' ? 'in' : rawDir === 'out' || rawDir === '0' ? 'out' : 'unknown';

    return { deviceId: this.config.deviceId, employeeRef, eventTime, direction, rawData: record };
  }
}
