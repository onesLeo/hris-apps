import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { ConfigService } from '@nestjs/config';
import { LocalFileStorageService } from '../../../src/common/storage/local-file-storage.service.ts';
import { S3CompatibleStorageService } from '../../../src/common/storage/s3-compatible-storage.service.ts';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

test('local file storage saves, reads, and deletes bytes on disk', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'hris-storage-'));
  const service = new LocalFileStorageService(makeConfig({ FILE_STORAGE_ROOT: rootDir }));

  try {
    const stored = await service.save('onboarding/tenant-1/case-1/task-1/file.txt', Buffer.from('hello'));
    assert.match(stored.location, /file\.txt$/);
    assert.equal((await readFile(stored.location)).toString('utf8'), 'hello');
    assert.equal((await service.read('onboarding/tenant-1/case-1/task-1/file.txt')).toString('utf8'), 'hello');

    await service.delete('onboarding/tenant-1/case-1/task-1/file.txt');
    await assert.rejects(
      () => service.read('onboarding/tenant-1/case-1/task-1/file.txt'),
      { code: 'ENOENT' },
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('local file storage rejects path traversal storage keys', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'hris-storage-'));
  const service = new LocalFileStorageService(makeConfig({ FILE_STORAGE_ROOT: rootDir }));

  try {
    await assert.rejects(
      () => service.save('../outside.txt', Buffer.from('bad')),
      /Invalid storage key/i,
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('s3-compatible storage signs requests and uses the configured bucket path', async () => {
  const calls: Array<{ input: string; method: string | undefined; authorization: string | null; contentType: string | null }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      input: String(input),
      method: init?.method,
      authorization: headers.get('authorization'),
      contentType: headers.get('content-type'),
    });

    if (init?.method === 'GET') {
      return new Response('hello', { status: 200 });
    }

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const service = new S3CompatibleStorageService(makeConfig({
    FILE_STORAGE_ENDPOINT: 'http://localhost:9000',
    FILE_STORAGE_BUCKET: 'hris',
    FILE_STORAGE_REGION: 'ap-southeast-1',
    FILE_STORAGE_ACCESS_KEY_ID: 'test-access-key',
    FILE_STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
    FILE_STORAGE_FORCE_PATH_STYLE: 'true',
  }));

  try {
    const stored = await service.save('onboarding/tenant-1/case-1/task-1/file.txt', Buffer.from('hello'));
    assert.equal(stored.location, 's3://hris/onboarding/tenant-1/case-1/task-1/file.txt');

    const bytes = await service.read('onboarding/tenant-1/case-1/task-1/file.txt');
    assert.equal(bytes.toString('utf8'), 'hello');

    await service.delete('onboarding/tenant-1/case-1/task-1/file.txt');

    assert.equal(calls.length, 3);
    assert.equal(calls[0]?.method, 'PUT');
    assert.ok(calls[0]?.input.includes('/hris/onboarding/tenant-1/case-1/task-1/file.txt'));
    assert.match(calls[0]?.authorization ?? '', /^AWS4-HMAC-SHA256 Credential=test-access-key\//);
    assert.equal(calls[1]?.method, 'GET');
    assert.equal(calls[2]?.method, 'DELETE');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('s3-compatible storage rejects unsafe storage keys', async () => {
  const service = new S3CompatibleStorageService(makeConfig({
    FILE_STORAGE_ENDPOINT: 'http://localhost:9000',
    FILE_STORAGE_BUCKET: 'hris',
    FILE_STORAGE_REGION: 'ap-southeast-1',
    FILE_STORAGE_ACCESS_KEY_ID: 'test-access-key',
    FILE_STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
    FILE_STORAGE_FORCE_PATH_STYLE: 'true',
  }));

  await assert.rejects(
    () => service.save('../outside.txt', Buffer.from('bad')),
    /Invalid storage key/i,
  );
});
