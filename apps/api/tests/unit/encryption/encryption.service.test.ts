import assert from 'node:assert/strict';
import test from 'node:test';

import { EncryptionService } from '../../../src/common/encryption/encryption.service.ts';

function makeService(hexKey?: string) {
  const key = hexKey ?? 'a'.repeat(64); // 32 bytes of 0xaa
  const config = { get: (_k: string) => key, getOrThrow: (_k: string) => key };
  const svc = new EncryptionService(config as never);
  svc.onModuleInit();
  return svc;
}

test('encrypt produces a string with 3 dot-separated base64 segments', () => {
  const svc = makeService();
  const result = svc.encrypt('hello');
  const parts = result.split('.');
  assert.equal(parts.length, 3);
  // Each part must be valid base64
  for (const part of parts) {
    assert.ok(part.length > 0);
    assert.doesNotThrow(() => Buffer.from(part, 'base64'));
  }
});

test('decrypt(encrypt(x)) === x round-trip', () => {
  const svc = makeService();
  const plaintext = 'sensitive-value-123';
  assert.equal(svc.decrypt(svc.encrypt(plaintext)), plaintext);
});

test('each encrypt call produces a different ciphertext (random IV)', () => {
  const svc = makeService();
  const a = svc.encrypt('same');
  const b = svc.encrypt('same');
  assert.notEqual(a, b);
});

test('decrypt throws on tampered ciphertext', () => {
  const svc = makeService();
  const encrypted = svc.encrypt('secret');
  const parts = encrypted.split('.');
  // Flip last byte of ciphertext
  const cipherBuf = Buffer.from(parts[1]!, 'base64');
  cipherBuf[0] = cipherBuf[0]! ^ 0xff;
  const tampered = `${parts[0]}.${cipherBuf.toString('base64')}.${parts[2]}`;
  assert.throws(() => svc.decrypt(tampered));
});

test('decrypt throws on tampered auth tag', () => {
  const svc = makeService();
  const encrypted = svc.encrypt('secret');
  const parts = encrypted.split('.');
  const tagBuf = Buffer.from(parts[2]!, 'base64');
  tagBuf[0] = tagBuf[0]! ^ 0xff;
  const tampered = `${parts[0]}.${parts[1]}.${tagBuf.toString('base64')}`;
  assert.throws(() => svc.decrypt(tampered));
});

test('decrypt throws on invalid format (missing segments)', () => {
  const svc = makeService();
  assert.throws(() => svc.decrypt('onlyone'), /Invalid encrypted format/);
});

test('different keys cannot decrypt each other\'s ciphertext', () => {
  const svc1 = makeService('a'.repeat(64));
  const svc2 = makeService('b'.repeat(64));
  const encrypted = svc1.encrypt('secret');
  assert.throws(() => svc2.decrypt(encrypted));
});

test('safeEquals returns true for identical strings', () => {
  const svc = makeService();
  assert.equal(svc.safeEquals('abc', 'abc'), true);
});

test('safeEquals returns false for different strings', () => {
  const svc = makeService();
  assert.equal(svc.safeEquals('abc', 'xyz'), false);
});

test('safeEquals returns false for strings of different length', () => {
  const svc = makeService();
  assert.equal(svc.safeEquals('abc', 'abcd'), false);
});
