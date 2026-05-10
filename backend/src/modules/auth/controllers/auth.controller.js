const { User } = require('../../../models');

// POST /auth/login - 微信小程序登录
exports.login = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/login_password - 账号密码登录
exports.loginPassword = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/register - 用户注册
exports.register = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/sms-code - 发送短信验证码
exports.sendSmsCode = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/admin/login - 管理员登录
exports.adminLogin = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

const _db2 = require('../../../models');
const _jwt2 = require('jsonwebtoken');
const _JWT_SECRET2 = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
async function _doPortalLogin(req, res, roleLabel, checkFn) {
  const { phone, password, user_id } = req.body;
  const BYPASS = process.env.PORTAL_TEST_BYPASS === '1';
  try {
    let userId, userInfo = {};
    if (BYPASS && user_id) {
      userId = Number(user_id);
      userInfo = { id: userId, phone: phone || '', nickname: '测试商家' };
    } else {
      if (!phone) return res.status(400).json({ code: 1, msg: '请填写手机号' });
      const { User } = _db2;
      if (!User) return res.status(503).json({ code: 1, msg: 'User模型未加载，请设置 PORTAL_TEST_BYPASS=1' });
      const user = await User.findOne({ where: { phone } });
      if (!user) return res.status(401).json({ code: 1, msg: '手机号未注册' });
      if (password) {
        let pwOk = false;
        if (user.password) {
          try { const bcrypt = require('bcrypt'); pwOk = await bcrypt.compare(String(password), user.password); }
          catch (_) { pwOk = String(password) === String(user.password); }
        }
        if (!pwOk) return res.status(401).json({ code: 1, msg: '密码错误' });
      }
      userId = user.id;
      userInfo = { id: user.id, phone: user.phone, nickname: user.nickname || user.name || user.phone };
    }
    const shopInfo = await checkFn(userId);
    if (!shopInfo) return res.status(403).json({ code: 1, msg: roleLabel + '资料不存在，请先在小程序完成入驻' });
    const token = _jwt2.sign({ id: userId, phone: userInfo.phone, role: 'merchant' }, _JWT_SECRET2, { expiresIn: '7d' });
    res.json({ code: 0, msg: 'ok', data: { token, user: userInfo, shop: shopInfo } });
  } catch(e) {
    console.error('[portal login]', e);
    res.status(500).json({ code: 1, msg: e.message || '登录失败' });
  }
}
exports.merchantPortalLogin = async (req, res) => {
  const { MerchantShop } = _db2;
  await _doPortalLogin(req, res, '集市店铺', async (userId) => {
    if (!MerchantShop) return null;
    const shop = await MerchantShop.findOne({ where: { user_id: userId } });
    if (!shop) return null;
    return { id: shop.id, name: shop.name, status: shop.status, logo: shop.logo };
  });
};
exports.servicePortalLogin = async (req, res) => {
  const { ServiceProviderProfile } = _db2;
  await _doPortalLogin(req, res, '服务商档案', async (userId) => {
    if (!ServiceProviderProfile) return null;
    const profile = await ServiceProviderProfile.findOne({ where: { user_id: userId } });
    if (!profile) return null;
    return { id: profile.id, name: profile.shop_name, status: profile.status };
  });
};
