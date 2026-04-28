/**
 * Integration test: Auth guard on protected endpoints
 *
 * Tests that protected routes return 401 without a JWT and that the error
 * response follows the ADR 006 shape.
 *
 * Requires the API to be running on localhost:3000.
 * Skip by setting SKIP_INTEGRATION=true in the environment.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

const BASE = `http://localhost:${process.env['PORT'] ?? 3000}/api/v1`;
const SKIP = process.env['SKIP_INTEGRATION'] === 'true';

type ApiErrorResponse = {
  error: { code: string; message: string };
};

function request(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: options.method ?? 'GET', headers: options.headers ?? {} }, (res) => {
      let raw = '';
      res.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET /api/v1/organization/overview returns 401 without Authorization header', { skip: SKIP }, async () => {
  const { status, body } = await request(`${BASE}/organization/overview`);
  assert.equal(status, 401);

  const err = body as ApiErrorResponse;
  assert.ok(err.error, 'response must have an error property');
  assert.ok(typeof err.error.code === 'string', 'error.code must be a string');
  assert.ok(typeof err.error.message === 'string', 'error.message must be a string');
});

test('GET /api/v1/organization/overview returns 401 with malformed Bearer token', { skip: SKIP }, async () => {
  const { status, body } = await request(`${BASE}/organization/overview`, {
    headers: { Authorization: 'Bearer not-a-valid-jwt' },
  });

  assert.equal(status, 401);
  const err = body as ApiErrorResponse;
  assert.ok(['auth.token.invalid', 'auth.token.expired'].includes(err.error.code),
    `unexpected error code: ${err.error.code}`);
});
