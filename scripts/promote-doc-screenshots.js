const fs = require('node:fs');
const path = require('node:path');

const names = [
  'manual-login.png',
  'manual-member-borrow-request.png',
  'manual-librarian-approval.png',
  'manual-borrowing-report.png',
];
const sourceDir = path.resolve(__dirname, '../output/playwright');
const targetDir = path.resolve(__dirname, '../docs/assets/user-manual');

fs.mkdirSync(targetDir, { recursive: true });
for (const name of names) {
  const source = path.join(sourceDir, name);
  if (!fs.existsSync(source)) throw new Error(`Missing screenshot ${source}`);
  fs.copyFileSync(source, path.join(targetDir, name));
}
console.log(`Promoted ${names.length} user-manual screenshots.`);
