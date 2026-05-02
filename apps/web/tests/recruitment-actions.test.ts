import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addRecruitmentRequisition,
  getRecruitmentOverview,
  getRecruitmentRequisitionKey,
  removeRecruitmentRequisition,
  updateRecruitmentRequisition,
} from '../src/components/recruitment/recruitment-data.ts';

test('addRecruitmentRequisition prepends a new role', () => {
  const overview = getRecruitmentOverview();
  const next = addRecruitmentRequisition(overview.requisitions, {
    title: 'HRIS QA Engineer',
    department: 'Engineering',
    location: 'Jakarta',
    openings: 1,
    recruiter: 'Alex Lee',
    priority: 'High',
  });

  assert.equal(next.length, overview.requisitions.length + 1);
  assert.equal(next[0]?.title, 'HRIS QA Engineer');
  assert.equal(next[0]?.accent, '#e8317a');
});

test('updateRecruitmentRequisition replaces the matching role', () => {
  const overview = getRecruitmentOverview();
  const key = getRecruitmentRequisitionKey(overview.requisitions[1]!);
  const next = updateRecruitmentRequisition(overview.requisitions, key, {
    title: 'Payroll Specialist',
    department: 'Finance',
    location: 'Bandung',
    openings: 2,
    recruiter: 'Reza Gunawan',
    priority: 'High',
  });

  assert.equal(next[1]?.title, 'Payroll Specialist');
  assert.equal(next[1]?.openings, 2);
  assert.equal(next[1]?.accent, '#e8317a');
});

test('removeRecruitmentRequisition deletes the matching role', () => {
  const overview = getRecruitmentOverview();
  const key = getRecruitmentRequisitionKey(overview.requisitions[0]!);
  const next = removeRecruitmentRequisition(overview.requisitions, key);

  assert.equal(next.length, overview.requisitions.length - 1);
  assert.ok(next.every((item) => getRecruitmentRequisitionKey(item) !== key));
});
