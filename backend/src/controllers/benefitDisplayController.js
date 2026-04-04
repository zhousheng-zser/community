const { BenefitAllianceConfig } = require('../jd');

function ok(res, data) {
  return res.json({ errno: 0, errmsg: 'ok', data });
}

function emptyHero() {
  return { heroImage: '', heroTitle: '', heroSubtitle: '' };
}

function missingTableMsg() {
  return '缺少数据表 benefit_alliance_config：请执行 backend/sql/benefit_alliance_config.sql，或设置 DB_SYNC_BENEFIT=1 后重启 backend';
}

/**
 * GET /api/v1/benefit/display?scene=benefit_card
 * 返回京东 / 拼多多惠民卡顶栏配置（头图与可选文案）；商品列表仍用 /jd/benefit/goods、/pdd/benefit/goods
 */
async function getDisplay(req, res) {
  try {
    const scene = (req.query.scene || 'benefit_card').trim();
    const rows = await BenefitAllianceConfig.findAll({
      where: { scene, status: 1 },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ]
    });
    const out = { jd: emptyHero(), pdd: emptyHero() };
    for (const r of rows) {
      const p = String(r.platform || '').toLowerCase();
      if (p !== 'jd' && p !== 'pdd') continue;
      out[p] = {
        heroImage: r.hero_image_url || '',
        heroTitle: r.hero_title || '',
        heroSubtitle: r.hero_subtitle || ''
      };
    }
    return ok(res, out);
  } catch (e) {
    const msg = (e && e.message) || '';
    if (/doesn't exist|ER_NO_SUCH_TABLE|no such table/i.test(msg)) {
      return res.status(500).json({ errno: 500, errmsg: missingTableMsg() });
    }
    console.error('[benefit/display]', e);
    return res.status(500).json({ errno: 500, errmsg: e.message || '服务器错误' });
  }
}

module.exports = { getDisplay };
