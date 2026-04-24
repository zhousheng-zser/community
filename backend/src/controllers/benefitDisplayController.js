const { BenefitAllianceConfig } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

function mapRow(row) {
  if (!row) {
    return {
      heroImage: null,
      heroTitle: '',
      heroSubtitle: ''
    };
  }
  return {
    heroImage: row.hero_image_url,
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || ''
  };
}

/**
 * GET /benefit/display?scene=benefit_card
 */
exports.getDisplay = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const rows = await BenefitAllianceConfig.findAll({ where: { scene } });
    const byPlatform = {};
    rows.forEach((r) => {
      byPlatform[r.platform] = r;
    });
    return ok(res, {
      jd: mapRow(byPlatform.jd),
      pdd: mapRow(byPlatform.pdd)
    });
  } catch (e) {
    console.error('[benefit display]', e);
    return fail(res, 500, '服务异常', 500);
  }
};
