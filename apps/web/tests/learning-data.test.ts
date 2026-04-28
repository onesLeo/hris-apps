import assert from 'node:assert/strict';
import test from 'node:test';
import { addLearningCourse, filterLearningCourses, getLearningOverview } from '../src/components/learning/learning-data.ts';

test('getLearningOverview returns the learning snapshot', () => {
  const overview = getLearningOverview();

  assert.equal(overview.courses, 8);
  assert.equal(overview.enrolled, 124);
  assert.equal(overview.courseCatalog.length, 4);
  assert.equal(overview.assignments.length, 4);
});

test('filterLearningCourses filters by status', () => {
  const overview = getLearningOverview();
  const filtered = filterLearningCourses(overview.courseCatalog, 'Mandatory', '');

  assert.ok(filtered.every((course) => course.status === 'Mandatory'));
});

test('filterLearningCourses matches search terms across fields', () => {
  const overview = getLearningOverview();
  const filtered = filterLearningCourses(overview.courseCatalog, 'All', 'leadership');

  assert.equal(filtered[0]?.title, 'Manager Coaching Basics');
});

test('addLearningCourse prepends a new learning course', () => {
  const overview = getLearningOverview();
  const next = addLearningCourse(overview.courseCatalog, {
    title: 'New Hire Orientation',
    owner: 'People Ops',
    duration: '2h',
    status: 'Optional',
    due: 'May 22',
    enrolled: 0,
    completion: 0,
  });

  assert.equal(next.length, overview.courseCatalog.length + 1);
  assert.equal(next[0]?.title, 'New Hire Orientation');
});
