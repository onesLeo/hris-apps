import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrganizationOverview } from '../src/components/organization/organization-data.ts';

test('getOrganizationOverview returns the organization snapshot', () => {
  const overview = getOrganizationOverview();

  assert.equal(overview.companyName, 'PeopleOS');
  assert.equal(overview.totalEmployees, 1247);
  assert.equal(overview.locations.length, 3);
  assert.equal(overview.departmentMap[0]?.name, 'Engineering');
  assert.equal(overview.structure.length, 3);
});
