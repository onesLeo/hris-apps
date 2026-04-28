import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOrganizationOverview } from '../src/modules/organization/organization.overview.ts';

test('organization overview builder returns a stable contract', () => {
  const overview = buildOrganizationOverview();

  assert.equal(overview.companyName, 'PeopleOS');
  assert.equal(overview.totalEmployees, 1247);
  assert.equal(overview.locations.length, 3);
  assert.equal(overview.departments[0]?.name, 'Engineering');
});
