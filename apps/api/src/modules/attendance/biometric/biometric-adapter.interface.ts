export type RawClockPayload = {
  deviceId: string;
  employeeRef: string;       // device-local identifier — may be badge number, biometric ID, etc.
  eventTime: string;         // ISO 8601
  direction: 'in' | 'out' | 'unknown';
  rawData: Record<string, unknown>;
};

export type AdapterProtocol = 'webhook_push' | 'polling' | 'database_polling' | 'file_drop' | 'mqtt';

export interface IBiometricAdapter {
  readonly protocol: AdapterProtocol;

  /** One-shot: pull and return any pending raw payloads. Used by polling adapters. */
  poll?(): Promise<RawClockPayload[]>;

  /** Start a long-running listener (file-drop watcher, MQTT subscriber). */
  start?(onPayload: (payload: RawClockPayload) => Promise<void>): Promise<void>;

  /** Gracefully stop a started listener. */
  stop?(): Promise<void>;
}
