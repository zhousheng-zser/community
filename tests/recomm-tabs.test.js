/**
 * 邻里帮帮双地址 Tab 与提交校验（Node 可运行，不依赖 wx）
 * 运行：npm run test:recomm
 */
const assert = require('assert');
const { SERVICE_TABS, getTabByKey, getSubmitBlockReason } = require('../utils/recommConfig.js');

function run() {
  assert.strictEqual(SERVICE_TABS.length, 6, '应有 6 个 Tab');

  const keys = new Set(SERVICE_TABS.map((t) => t.key));
  assert.deepStrictEqual(
    [...keys].sort(),
    ['child', 'escort', 'pet', 'study', 'take', 'trash'].sort(),
    'key 集合'
  );

  for (const t of SERVICE_TABS) {
    assert.ok(t.text && t.label && t.placeholder, `${t.key}: text/label/placeholder`);
    assert.ok(
      t.secondLabel && String(t.secondLabel).trim(),
      `${t.key}: 须为双地址，secondLabel 非空`
    );
    assert.ok(
      t.secondPlaceholder && String(t.secondPlaceholder).trim(),
      `${t.key}: secondPlaceholder 非空`
    );
  }

  assert.strictEqual(getTabByKey('take').key, 'take');
  assert.strictEqual(getTabByKey('child').key, 'child');
  assert.strictEqual(getTabByKey('unknown').key, 'take', '未知 key 回退代取');

  const take = getTabByKey('take');
  assert.strictEqual(
    getSubmitBlockReason(take, { from: '', to: '' }),
    take.placeholder,
    '缺 from 提示 placeholder'
  );
  assert.strictEqual(
    getSubmitBlockReason(take, { from: 'A', to: '' }),
    take.secondPlaceholder,
    '缺 to 提示 secondPlaceholder'
  );
  assert.strictEqual(getSubmitBlockReason(take, { from: 'A', to: 'B' }), null, '双地址齐可提交');

  const escort = getTabByKey('escort');
  assert.strictEqual(getSubmitBlockReason(escort, { from: '家', to: '' }), escort.secondPlaceholder);

  console.log('recomm-tabs: all passed');
}

try {
  run();
} catch (e) {
  console.error(e);
  process.exit(1);
}
