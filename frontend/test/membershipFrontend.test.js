import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('membership page uses canonical API data and never substitutes demo applications', async () => {
  const source = await readFile(new URL('../src/page/MembershipPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /membershipApi\.getMyStatus\(\)/);
  assert.match(source, /membershipApi\.listApplications\(/);
  assert.match(source, /setLoadError\(error\.message\)/);
  assert.doesNotMatch(source, /DEMO_APPLICATIONS|an\.nguyen@example\.com/);
  assert.match(source, /membershipStatusView/);
  assert.match(source, /currentApplication/);
  assert.doesNotMatch(source, /setMyStatus\(EMPTY_STATUS\)/);
  assert.doesNotMatch(source, /status:\s*'PENDING',\s*appliedAt:\s*new Date/);
});

test('membership application requires a complete personal profile and keeps the empty-body contract', async () => {
  const form = await readFile(new URL('../src/component/membership/MembershipApplicationForm.jsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');
  const page = await readFile(new URL('../src/page/MembershipPage.jsx', import.meta.url), 'utf8');

  assert.match(form, /onSubmit\(\{\}\)/);
  for (const field of ['fullName', 'phone', 'dateOfBirth', 'address']) assert.match(form, new RegExp(`profile\\?\\.${field}`));
  assert.match(form, /missingFields\.length > 0/);
  assert.match(form, /to="\/profile"/);
  assert.match(page, /fetchMyProfile\(\)/);
  assert.doesNotMatch(form, /fullName:|phone:|address:|note:/);
  assert.match(api, /apply\(data = \{\}\)/);
  assert.match(api, /url: '\/membership\/applications', data/);
});

test('membership UI explains the connected FE07 daily borrowing allowance', async () => {
  const form = await readFile(new URL('../src/component/membership/MembershipApplicationForm.jsx', import.meta.url), 'utf8');
  const status = await readFile(new URL('../src/component/membership/MyMembershipStatus.jsx', import.meta.url), 'utf8');

  assert.match(form, /Tăng hạn mức từ 3 lên 5 sách mỗi ngày/);
  assert.match(status, /statusKey === 'APPROVED' \? 5 : 3/);
  assert.match(status, /sách\/ngày/);
});

test('librarian navigation exposes the FE04 review workspace', async () => {
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  assert.match(navigation, /key: 'membership-review', label: 'Duyệt hội viên', path: '\/membership'/);
});

test('librarian membership review renders one reload action', async () => {
  const page = await readFile(new URL('../src/page/MembershipPage.jsx', import.meta.url), 'utf8');
  const filter = await readFile(new URL('../src/component/membership/MembershipFilter.jsx', import.meta.url), 'utf8');

  assert.equal(page.match(/Tải lại/g)?.length, 1);
  assert.doesNotMatch(page, /onReload=\{loadData\}/);
  assert.match(filter, /\{onReload && \(/);
});

test('membership errors stay truthful and never claim demo fallback data', async () => {
  const messages = await readFile(new URL('../src/api/apiErrorMessages.js', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');

  assert.match(messages, /export function getMembershipErrorMessage/);
  assert.match(api, /getMembershipErrorMessage/);
  assert.match(api, /authorizedMembershipRequest/);
  assert.doesNotMatch(
    messages.match(/export function getMembershipErrorMessage[\s\S]*?(?=\nexport function|$)/)?.[0] || '',
    /demo/i
  );
});

test('membership review and list enforce canonical server boundaries', async () => {
  const page = await readFile(new URL('../src/page/MembershipPage.jsx', import.meta.url), 'utf8');
  const modal = await readFile(new URL('../src/component/membership/MembershipReviewModal.jsx', import.meta.url), 'utf8');
  const status = await readFile(new URL('../src/component/membership/MyMembershipStatus.jsx', import.meta.url), 'utf8');

  assert.match(page, /q:\s*search\.trim\(\)\s*\|\|\s*undefined/);
  assert.doesNotMatch(page, /filteredApplications/);
  assert.match(page, /await loadData\(\)/);
  assert.match(modal, /maxLength=\{500\}/);
  assert.match(status, /membershipStatusView/);
  assert.match(status, /currentApplication/);
});
