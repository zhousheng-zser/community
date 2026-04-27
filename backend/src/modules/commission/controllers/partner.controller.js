/**
 * Partner Controller
 * Handles partner role management, downline tracking, applications
 */
const {
  PartnerRole,
  PartnerRelation,
  User
} = require('../../../models');
const commissionService = require('../services/commission.service');

// GET /partner/me - Get current user's partner role info
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const roles = await PartnerRole.findAll({
      where: { user_id: userId, status: 'active' }
    });

    // Get downline count (users invited by this user)
    const downlineCount = await User.count({
      where: { invited_by: userId }
    });

    // Get partner chain
    const relation = await PartnerRelation.findOne({
      where: { promoter_user_id: userId, is_valid: true }
    });

    res.json({ code: 0, msg: 'ok', data: {
      user_id: userId,
      roles: roles.map(r => r.role),
      role_details: roles.map(r => ({
        role: r.role,
        status: r.status,
        approved_at: r.approved_at,
        created_at: r.created_at
      })),
      downline_count: downlineCount,
      partner_chain: relation ? {
        district_partner_user_id: relation.district_partner_user_id,
        market_partner_user_id: relation.market_partner_user_id
      } : null
    }});
  } catch (error) {
    console.error('获取合伙人信息失败:', error);
    res.status(500).json({ code: 1, msg: '获取合伙人信息失败' });
  }
};

// GET /partner/my-downlines - List users invited by current user
exports.getMyDownlines = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: { invited_by: userId },
      attributes: ['id', 'nickname', 'avatar_url', 'phone', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const list = result.rows.map(u => ({
      id: u.id,
      nickname: u.nickname,
      avatar_url: u.avatar_url,
      phone: u.phone ? u.phone.substring(0, 3) + '****' + u.phone.substring(7) : '',
      created_at: u.created_at
    }));

    res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page } });
  } catch (error) {
    console.error('获取下线列表失败:', error);
    res.status(500).json({ code: 1, msg: '获取下线列表失败' });
  }
};

// POST /partner/apply - Apply for a partner role
exports.apply = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.body;

    if (!role || !['promoter', 'district_partner', 'market_partner'].includes(role)) {
      return res.status(400).json({ code: 1, msg: '无效的角色类型' });
    }

    // Check if already has this role
    const existing = await PartnerRole.findOne({
      where: { user_id: userId, role }
    });

    if (existing) {
      return res.status(400).json({ code: 1, msg: '已拥有该角色' });
    }

    // For promoter role, auto-approve
    if (role === 'promoter') {
      const partnerRole = await commissionService.assignPromoterRole(userId);
      return res.json({ code: 0, msg: '已成为推广者', data: partnerRole.toJSON() });
    }

    // For district/market partner, create pending application
    const partnerRole = await PartnerRole.create({
      user_id: userId,
      role,
      status: 'pending_approval',
      created_at: new Date()
    });

    res.json({ code: 0, msg: '申请已提交，等待审核', data: partnerRole.toJSON() });
  } catch (error) {
    console.error('合伙人申请失败:', error);
    res.status(500).json({ code: 1, msg: '申请失败' });
  }
};

// POST /partner/refresh-chain - Force re-resolve partner chain
exports.refreshChain = async (req, res) => {
  try {
    const userId = req.user.id;

    // Invalidate existing cache
    await PartnerRelation.update(
      { is_valid: false },
      { where: { promoter_user_id: userId } }
    );

    // Re-resolve
    const result = await commissionService.resolvePartnerChain(userId);

    res.json({ code: 0, msg: '合伙人链已更新', data: result });
  } catch (error) {
    console.error('刷新合伙人链失败:', error);
    res.status(500).json({ code: 1, msg: '刷新失败' });
  }
};
