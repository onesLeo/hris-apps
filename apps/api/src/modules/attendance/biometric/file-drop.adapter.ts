import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { IBiometricAdapter, RawClockPayload } from './biometric-adapter.interface';

export type FileDropConfig = {
  deviceId: string;
  watchDir: string;
  filePattern: RegExp;
  archiveDir?: string;
  intervalSeconds: number;
};

/**
 * File-drop adapter — watches a directory for new CSV/JSON clock export files
 * dropped by the device (e.g. via SFTP or shared network drive).
 * On pickup: parse → emit payloads → move file to archiveDir (if set).
 */
export class FileDropAdapter extends EventEmitter implements IBiometricAdapter {
  readonly protocol = 'file_drop' as const;
  private watchTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly config: FileDropConfig) {
    super();
  }

  async start(onPayload: (payload: RawClockPayload) => Promise<void>): Promise<void> {
    this.watchTimer = setInterval(() => this.tick(onPayload), this.config.intervalSeconds * 1000);
    await this.tick(onPayload);
  }

  async stop(): Promise<void> {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
  }

  private async tick(onPayload: (p: RawClockPayload) => Promise<void>): Promise<void> {
    if (!fs.existsSync(this.config.watchDir)) return;

    const files = fs.readdirSync(this.config.watchDir)
      .filter((f) => this.config.filePattern.test(f));

    for (const file of files) {
      const filePath = path.join(this.config.watchDir, file);
      try {
        const payloads = this.parseFile(filePath);
        for (const p of payloads) {
          await onPayload(p);
        }
        this.archiveFile(filePath, file);
      } catch {
        // leave the file in place; it will be retried on the next tick
      }
    }
  }

  private parseFile(filePath: string): RawClockPayload[] {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (filePath.endsWith('.json')) {
      const data = JSON.parse(content) as unknown;
      const records = Array.isArray(data) ? data : [data];
      return (records as Record<string, unknown>[]).map((r) => this.normalise(r));
    }

    // CSV: first line = header
    const lines = content.split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0]!.split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => { row[h] = values[i]; });
      return this.normalise(row);
    });
  }

  private normalise(row: Record<string, unknown>): RawClockPayload {
    const eventTime = String(row.timestamp ?? row.event_time ?? row.datetime ?? new Date().toISOString());
    const employeeRef = String(row.employee_id ?? row.user_id ?? row.badge_no ?? '');
    const rawDir = String(row.direction ?? row.type ?? '').toLowerCase();
    const direction: RawClockPayload['direction'] =
      rawDir === 'in' || rawDir === '1' ? 'in' : rawDir === 'out' || rawDir === '0' ? 'out' : 'unknown';

    return { deviceId: this.config.deviceId, employeeRef, eventTime, direction, rawData: row };
  }

  private archiveFile(filePath: string, filename: string): void {
    if (!this.config.archiveDir) {
      fs.unlinkSync(filePath);
      return;
    }
    if (!fs.existsSync(this.config.archiveDir)) {
      fs.mkdirSync(this.config.archiveDir, { recursive: true });
    }
    fs.renameSync(filePath, path.join(this.config.archiveDir, filename));
  }
}
