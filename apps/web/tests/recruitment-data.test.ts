import assert from 'node:assert/strict';
import test from 'node:test';
import { filterRecruitmentCandidates, getRecruitmentOverview } from '../src/components/recruitment/recruitment-data.ts';

test('getRecruitmentOverview returns the recruitment snapshot', () => {
  const overview = getRecruitmentOverview();

  assert.equal(overview.openRoles, 14);
  assert.equal(overview.activeCandidates, 86);
  assert.equal(overview.requisitions.length, 4);
  assert.equal(overview.pipeline.length, 4);
  assert.equal(overview.candidates[0]?.name, 'Dina Ramadhani');
});

test('filterRecruitmentCandidates filters by stage', () => {
  const overview = getRecruitmentOverview();
  const filtered = filterRecruitmentCandidates(overview.candidates, 'Interview', '');

  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((candidate) => candidate.stage === 'Interview'));
});

test('filterRecruitmentCandidates matches search terms across fields', () => {
  const overview = getRecruitmentOverview();
  const filtered = filterRecruitmentCandidates(overview.candidates, 'All', 'people partner');

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.name, 'Sari Kusuma');
});
