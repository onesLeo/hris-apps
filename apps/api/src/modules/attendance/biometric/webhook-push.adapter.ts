import type { IBiometricAdapter, RawClockPayload } from './biometric-adapter.interface';

/**
 * Webhook-push adapter — the device POSTs events directly to our API.
 * This adapter is stateless: it only normalises a pre-parsed request body
 * into the canonical RawClockPayload shape. The controller calls normalise().
 */
export class WebhookPushAdapter implements IBiometricAdapter {
  readonly protocol = 'webhook_push' as const;

  normalise(deviceId: string, body: Record<string, unknown>): RawClockPayload {
    const eventTime = String(body.timestamp ?? body.event_time ?? new Date().toISOString());
    const employeeRef = String(body.employee_id ?? body.user_id ?? body.badge_no ?? '');
    const rawDirection = String(body.direction ?? body.type ?? '').toLowerCase();
    const direction: RawClockPayload['direction'] =
      rawDirection === 'in' || rawDirection === 'check_in' || rawDirection === '1' ? 'in'
        : rawDirection === 'out' || rawDirection === 'check_out' || rawDirection === '0' ? 'out'
          : 'unknown';

    return { deviceId, employeeRef, eventTime, direction, rawData: body };
  }
}
