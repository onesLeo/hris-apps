/**
 * Integration test: Health endpoint
 *
 * Tests that GET /api/v1/health is publicly accessible (no JWT required)
 * and returns the expected shape. Uses Node's built-in http module so there
 * are no extra runtime dependencies.
 *
 * Requires the API to be running on localhost:3000.
 * Skip by setting SKIP_INTEGRATION=true in the environment.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

const BASE = `http://localhost:${process.env['PORT'] ?? 3000}/api/v1`;
const SKIP = process.env['SKIP_INTEGRATION'] === 'true';

function get(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, body: raw });
        }
      });
    }).on('error', reject);
  });
}

test('GET /api/v1/health returns 200 without authentication', { skip: SKIP }, async () => {
  const { status, body } = await get(`${BASE}/health`);
  assert.equal(status, 200);
  assert.deepEqual(body, { status: 'ok', service: 'api' });
});
