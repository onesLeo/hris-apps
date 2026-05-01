import type { IBiometricAdapter, RawClockPayload } from './biometric-adapter.interface';

export type MqttAdapterConfig = {
  deviceId: string;
  brokerUrl: string;
  topic: string;
  clientId?: string;
  username?: string;
  password?: string;
};

/**
 * MQTT adapter — subscribes to a broker topic where the device publishes
 * clock events as JSON messages.
 *
 * The actual MQTT client (mqtt.js) is instantiated lazily so the adapter
 * can be constructed without the optional dependency being installed.
 */
export class MqttAdapter implements IBiometricAdapter {
  readonly protocol = 'mqtt' as const;
  private client: any = null;

  constructor(private readonly config: MqttAdapterConfig) {}

  async start(onPayload: (payload: RawClockPayload) => Promise<void>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mqtt = await import('mqtt').catch(() => {
      throw new Error('mqtt package is required for MqttAdapter — install it with: pnpm add mqtt');
    });

    this.client = mqtt.connect(this.config.brokerUrl, {
      clientId: this.config.clientId ?? `hris-biometric-${Date.now()}`,
      username: this.config.username,
      password: this.config.password,
    });

    this.client.on('connect', () => {
      this.client.subscribe(this.config.topic);
    });

    this.client.on('message', async (_topic: string, message: Buffer) => {
      try {
        const raw = JSON.parse(message.toString()) as Record<string, unknown>;
        const payload = this.normalise(raw);
        await onPayload(payload);
      } catch {
        // malformed message — skip
      }
    });
  }

  async stop(): Promise<void> {
    if (this.client) {
      await new Promise<void>((resolve) => this.client.end(false, {}, resolve));
      this.client = null;
    }
  }

  private normalise(raw: Record<string, unknown>): RawClockPayload {
    const eventTime = String(raw.timestamp ?? raw.event_time ?? new Date().toISOString());
    const employeeRef = String(raw.employee_id ?? raw.user_id ?? raw.badge_no ?? '');
    const rawDir = String(raw.direction ?? raw.type ?? '').toLowerCase();
    const direction: RawClockPayload['direction'] =
      rawDir === 'in' || rawDir === '1' ? 'in' : rawDir === 'out' || rawDir === '0' ? 'out' : 'unknown';

    return { deviceId: this.config.deviceId, employeeRef, eventTime, direction, rawData: raw };
  }
}
