import assert from 'node:assert/strict';
import test from 'node:test';
import { addPerformanceCycle, getPerformanceOverview } from '../src/components/performance/performance-data.ts';

test('addPerformanceCycle prepends a new cycle', () => {
  const overview = getPerformanceOverview();
  const next = addPerformanceCycle(overview.reviewCycles, {
    name: 'Q4 Review',
    period: 'Oct - Dec 2026',
    status: 'Scheduled',
    participants: 154,
    completion: 0,
  });

  assert.equal(next.length, overview.reviewCycles.length + 1);
  assert.equal(next[0]?.name, 'Q4 Review');
  assert.equal(next[0]?.accent, '#8b5cf6');
});
