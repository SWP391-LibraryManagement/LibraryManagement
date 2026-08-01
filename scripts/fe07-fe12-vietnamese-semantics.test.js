const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const featureDirs = [
  'feat-borrowing-management',
  'feat-reservation-management',
  'feat-notification-management',
  'feat-reporting-statistics',
];
const documentNames = ['CONTEXT.md', 'SPEC.md', 'PLAN.md', 'TASKS.md', 'TEST_PLAN.md', 'CHANGELOG.md'];

const readFeatureDocuments = async (featureDir) => {
  const documents = await Promise.all(documentNames.map(async (name) => ({
    name,
    text: await readFile(path.join(root, '.sdd', 'specs', featureDir, name), 'utf8'),
  })));
  return Object.fromEntries(documents.map(({ name, text }) => [name, text]));
};

test('FE07 documents preserve technical names and use library-domain wording', async () => {
  const documents = await readFeatureDocuments('feat-borrowing-management');
  const allText = Object.values(documents).join('\n');

  for (const corrupted of [
    /Kiểm toánLogs/,
    /borrowingTuyến APIs\.test\.js/,
    /borrowingTầng truy cập dữ liệu\.test\.js/,
    /mượn mượn/,
    /ngày làm việc/,
    /ngày kinh doanh/,
    /đặt trước/,
    /(?:^|[^\p{L}])ứng viên(?:$|[^\p{L}])/iu,
  ]) assert.doesNotMatch(allText, corrupted);

  assert.match(documents['SPEC.md'], /AuditLogs/);
  assert.match(documents['SPEC.md'], /borrowingRoutes\.test\.js/);
  assert.match(documents['SPEC.md'], /borrowingRepository\.test\.js/);
  assert.match(documents['SPEC.md'], /ngày nghiệp vụ/);
});

test('FE08 documents avoid duplicated machine-translated phrases', async () => {
  const documents = await readFeatureDocuments('feat-reservation-management');
  const allText = Object.values(documents).join('\n');

  assert.doesNotMatch(allText, /thông báo thông báo|triển khai triển khai|(?:^|[^\p{L}])ứng viên(?:$|[^\p{L}])/iu);
});

test('FE10 documents preserve sentAt and rethrow literals', async () => {
  const documents = await readFeatureDocuments('feat-notification-management');
  const allText = Object.values(documents).join('\n');

  assert.doesNotMatch(allText, /đã gửiAt|rethhàng|triển khai triển khai/);
  assert.match(documents['SPEC.md'], /sentAt/);
  assert.match(documents['TASKS.md'], /rethrow/);
});

test('FE12 documents use borrowing terminology and preserve roleId', async () => {
  const documents = await readFeatureDocuments('feat-reporting-statistics');
  const allText = Object.values(documents).join('\n');

  assert.doesNotMatch(allText, /\bvay\b|vai tròId/iu);
  assert.match(documents['SPEC.md'], /roleId/);
  assert.match(documents['SPEC.md'], /mượn sách/);
});
