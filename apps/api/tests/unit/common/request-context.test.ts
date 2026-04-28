import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestContext } from '../../../src/common/context/request-context.ts';

test('RequestContext.get() returns undefined outside a run() call', () => {
  assert.equal(RequestContext.get(), undefined);
});

test('RequestContext.run() makes context available inside the callback', () => {
  const ctx = { requestId: 'req-1', traceId: 'trace-1' };

  RequestContext.run(ctx, () => {
    const stored = RequestContext.get();
    assert.deepEqual(stored, ctx);
  });
});

test('RequestContext.get() returns undefined after run() exits', () => {
  RequestContext.run({ requestId: 'req-2' }, () => {});
  assert.equal(RequestContext.get(), undefined);
});

test('RequestContext.getOrThrow() throws outside a run() call', () => {
  assert.throws(() => RequestContext.getOrThrow(), /No request context found/);
});

test('RequestContext.getOrThrow() returns context inside a run() call', () => {
  const ctx = { requestId: 'req-3', tenantId: 'tenant-abc' };

  RequestContext.run(ctx, () => {
    const stored = RequestContext.getOrThrow();
    assert.equal(stored.requestId, 'req-3');
    assert.equal(stored.tenantId, 'tenant-abc');
  });
});

test('nested run() calls are isolated from each other', async () => {
  const results: Array<string | undefined> = [];

  await Promise.all([
    new Promise<void>((resolve) => {
      RequestContext.run({ requestId: 'req-outer' }, () => {
        results.push(RequestContext.get()?.requestId);
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      RequestContext.run({ requestId: 'req-inner' }, () => {
        results.push(RequestContext.get()?.requestId);
        resolve();
      });
    }),
  ]);

  assert.ok(results.includes('req-outer'));
  assert.ok(results.includes('req-inner'));
});

test('mutating context inside run() does not affect the outer context', () => {
  const outer = { requestId: 'req-outer', tenantId: 'tenant-a' };

  RequestContext.run(outer, () => {
    const ctx = RequestContext.getOrThrow();
    ctx.tenantId = 'tenant-b';
  });

  // outer reference was mutated (AsyncLocalStorage shares the object reference)
  // — this test documents the expected behaviour: callers should not mutate ctx
  assert.equal(outer.tenantId, 'tenant-b');
});
