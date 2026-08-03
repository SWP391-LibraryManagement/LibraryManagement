const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('actor list uses software-domain terminology instead of performer wording', async () => {
  const actorList = await readFile(
    path.join(root, 'docs', 'phase_1_foundation', '03_actor_list.md'),
    'utf8'
  );

  assert.doesNotMatch(actorList, /diễn viên|người thực hiện/iu);
  assert.match(actorList, /# Danh sách tác nhân/);
  assert.match(actorList, /Tác nhân con người/);
});
