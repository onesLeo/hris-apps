import assert from 'node:assert/strict';
import test from 'node:test';
import { filterPerformanceReviews, getPerformanceOverview } from '../src/components/performance/performance-data.ts';

test('getPerformanceOverview returns the performance snapshot', () => {
  const overview = getPerformanceOverview();

  assert.equal(overview.cycles, 4);
  assert.equal(overview.completedReviews, 126);
  assert.equal(overview.reviewCycles.length, 4);
  assert.equal(overview.teamReviews.length, 5);
  assert.equal(overview.goals[0]?.goal, 'Reduce hiring cycle time');
});

test('filterPerformanceReviews filters by status', () => {
  const overview = getPerformanceOverview();
  const filtered = filterPerformanceReviews(overview.teamReviews, 'Completed', '');

  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((review) => review.status === 'Completed'));
});

test('filterPerformanceReviews matches search terms across review fields', () => {
  const overview = getPerformanceOverview();
  const filtered = filterPerformanceReviews(overview.teamReviews, 'All', 'resilience');

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.employee, 'Bima Pratama');
});
