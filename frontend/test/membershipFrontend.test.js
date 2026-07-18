import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('membership page uses canonical API data and never substitutes demo applications', async () => {
  const source = await readFile(new URL('../src/page/MembershipPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /membershipApi\.getMyStatus\(\)/);
  assert.match(source, /membershipApi\.listApplications\(/);
  assert.match(source, /setLoadError\(error\.message\)/);
  assert.doesNotMatch(source, /DEMO_APPLICATIONS|an\.nguyen@example\.com/);
});

test('membership application follows the approved empty-body contract', async () => {
  const form = await readFile(new URL('../src/component/membership/MembershipApplicationForm.jsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');

  assert.match(form, /onSubmit\(\{\}\)/);
  assert.doesNotMatch(form, /fullName:|phone:|address:|note:/);
  assert.match(api, /apply\(data = \{\}\)/);
  assert.match(api, /url: '\/membership\/applications', data/);
});

test('librarian navigation exposes the FE04 review workspace', async () => {
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  assert.match(navigation, /key: 'membership-review', label: 'Duyệt hội viên', path: '\/membership'/);
});
