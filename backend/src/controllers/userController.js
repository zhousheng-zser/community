const { User, UserFollow, UserAddress } = require('../models');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'openid', 'nickname', 'avatar_url', 'phone', 'address', 'bank_num', 'wx_id', 'role', 'balance']
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { nickname, phone, address, bank_num, wx_id } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (nickname) user.nickname = nickname;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (bank_num) user.bank_num = bank_num;
        if (wx_id) user.wx_id = wx_id;

        if (req.file) {
            const baseUrl = req.protocol + '://' + req.get('host');
            user.avatar_url = baseUrl + '/uploads/' + req.file.filename;
        }

        await user.save();

        res.json({
            message: '个人资料更新成功',
            user: {
                id: user.id,
                nickname: user.nickname,
                avatar_url: user.avatar_url,
                phone: user.phone,
                address: user.address,
                bank_num: user.bank_num,
                wx_id: user.wx_id,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};

// Mock Account Info
exports.getAccountInfo = async (req, res) => {
    res.json({ totalAcount: 0 });
};

// Mock User Coupons
exports.getUserCoupons = async (req, res) => {
    res.json([]);
};

// 获取我的关注列表 GET /api/v1/user/follows
exports.getFollows = async (req, res) => {
    try {
        const userId = req.user.id;
        const list = await UserFollow.findAll({
            where: { user_id: userId },
            include: [{ model: User, as: 'followUser', attributes: ['id', 'nickname', 'avatar_url'] }]
        });
        res.json({ message: '获取成功', data: list });
    } catch (e) {
        console.error('获取关注列表失败:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

function parseAddressBody(body) {
    const b = body || {};
    const lat = b.latitude !== undefined ? b.latitude : b.lat;
    const lng = b.longitude !== undefined ? b.longitude : b.lng;
    return {
        name: b.name,
        phone: b.phone,
        province: b.province,
        city: b.city,
        district: b.district,
        detail: b.detail,
        tag: b.tag,
        location_poi_name: b.location_poi_name !== undefined ? b.location_poi_name : b.locationPoiName,
        latitude: lat,
        longitude: lng
    };
}

/** 请求体是否显式带了默认地址字段（用于 PUT 区分「未传」与「传 false」） */
function getIsDefaultFromBody(body) {
    if (!body || typeof body !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(body, 'is_default')) return body.is_default;
    if (Object.prototype.hasOwnProperty.call(body, 'isDefault')) return body.isDefault;
    return undefined;
}

function truthyDefault(v) {
    return v === true || v === 1 || v === '1' || v === 'true';
}

function falseyDefault(v) {
    return v === false || v === 0 || v === '0' || v === 'false';
}

/** 列表/详情：同时返回 is_default(0/1) 与 isDefault(boolean)，见《收货地址_默认字段_前端对后端需求.md》 */
function toAddressJson(row) {
    const o = row.get ? row.get({ plain: true }) : { ...row };
    const flag = o.is_default === 1 || o.is_default === true;
    return {
        ...o,
        is_default: flag ? 1 : 0,
        isDefault: flag
    };
}

/**
 * 保证同一用户有且仅有一条默认地址（若只有一条则必为默认；多条时若无默认则把最近更新的一条设为默认；多条默认则保留 id 最小的一条）
 */
async function ensureUserAddressDefault(userId) {
    const list = await UserAddress.findAll({
        where: { user_id: userId },
        order: [['id', 'ASC']]
    });
    if (list.length === 0) return;
    if (list.length === 1) {
        if (!list[0].is_default) await list[0].update({ is_default: 1 });
        return;
    }
    const marked = list.filter((a) => a.is_default);
    if (marked.length === 0) {
        const pick = await UserAddress.findOne({
            where: { user_id: userId },
            order: [['updated_at', 'DESC'], ['id', 'DESC']]
        });
        if (pick) await pick.update({ is_default: 1 });
        return;
    }
    if (marked.length > 1) {
        const keepId = Math.min(...marked.map((m) => m.id));
        await UserAddress.update({ is_default: 0 }, { where: { user_id: userId } });
        await UserAddress.update({ is_default: 1 }, { where: { id: keepId, user_id: userId } });
    }
}

function normalizeCoordPair(latitude, longitude) {
    const hasLat = latitude !== undefined && latitude !== null && latitude !== '';
    const hasLng = longitude !== undefined && longitude !== null && longitude !== '';
    if (hasLat !== hasLng) {
        return { error: 'latitude 与 longitude 需同时提供或同时省略' };
    }
    if (!hasLat) return { latitude: null, longitude: null };
    const la = Number(latitude);
    const ln = Number(longitude);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        return { error: 'latitude/longitude 必须为有效数字' };
    }
    return { latitude: la, longitude: ln };
}

// ---------- 地址管理 CRUD（与 API_DOC §8.4、纪要 08 一致）----------
exports.getAddresses = async (req, res) => {
    try {
        const list = await UserAddress.findAll({
            where: { user_id: req.user.id },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });
        res.json({ code: 0, msg: 'ok', data: list.map(toAddressJson) });
    } catch (e) {
        console.error('获取地址列表失败:', e);
        res.status(500).json({ code: 500, msg: '获取失败', data: null });
    }
};

exports.createAddress = async (req, res) => {
    try {
        const p = parseAddressBody(req.body);
        if (!p.name || !p.phone || !p.detail) {
            return res.status(400).json({ code: 400, msg: '请填写 name、phone、detail', data: null });
        }
        const coord = normalizeCoordPair(p.latitude, p.longitude);
        if (coord.error) {
            return res.status(400).json({ code: 400, msg: coord.error, data: null });
        }
        const existingCount = await UserAddress.count({ where: { user_id: req.user.id } });
        const rawFlag = getIsDefaultFromBody(req.body);
        let isDef;
        if (existingCount === 0) {
            isDef = 1;
        } else {
            isDef = truthyDefault(rawFlag) ? 1 : 0;
        }
        if (isDef) {
            await UserAddress.update({ is_default: 0 }, { where: { user_id: req.user.id } });
        }
        const row = await UserAddress.create({
            user_id: req.user.id,
            name: p.name,
            phone: p.phone,
            province: p.province || null,
            city: p.city || null,
            district: p.district || null,
            detail: p.detail,
            tag: p.tag || null,
            location_poi_name: p.location_poi_name || null,
            latitude: coord.latitude,
            longitude: coord.longitude,
            is_default: isDef
        });
        await ensureUserAddressDefault(req.user.id);
        await row.reload();
        res.status(201).json({ code: 0, msg: 'ok', data: toAddressJson(row) });
    } catch (e) {
        console.error('新增地址失败:', e);
        res.status(500).json({ code: 500, msg: '新增失败', data: null });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const id = req.params.id;
        const addr = await UserAddress.findOne({ where: { id, user_id: req.user.id } });
        if (!addr) return res.status(404).json({ code: 404, msg: '地址不存在', data: null });
        const p = parseAddressBody(req.body);
        if (p.name !== undefined) addr.name = p.name;
        if (p.phone !== undefined) addr.phone = p.phone;
        if (p.province !== undefined) addr.province = p.province;
        if (p.city !== undefined) addr.city = p.city;
        if (p.district !== undefined) addr.district = p.district;
        if (p.detail !== undefined) addr.detail = p.detail;
        if (p.tag !== undefined) addr.tag = p.tag;
        if (p.location_poi_name !== undefined) addr.location_poi_name = p.location_poi_name;
        if (p.latitude !== undefined || p.longitude !== undefined) {
            const coord = normalizeCoordPair(
                p.latitude !== undefined ? p.latitude : addr.latitude,
                p.longitude !== undefined ? p.longitude : addr.longitude
            );
            if (coord.error) {
                return res.status(400).json({ code: 400, msg: coord.error, data: null });
            }
            addr.latitude = coord.latitude;
            addr.longitude = coord.longitude;
        }
        const rawFlag = getIsDefaultFromBody(req.body);
        if (rawFlag !== undefined) {
            if (truthyDefault(rawFlag)) {
                await UserAddress.update({ is_default: 0 }, { where: { user_id: req.user.id } });
                addr.is_default = 1;
            } else if (falseyDefault(rawFlag) || rawFlag === null) {
                addr.is_default = 0;
            }
        }
        await addr.save();
        await ensureUserAddressDefault(req.user.id);
        await addr.reload();
        res.json({ code: 0, msg: 'ok', data: toAddressJson(addr) });
    } catch (e) {
        console.error('修改地址失败:', e);
        res.status(500).json({ code: 500, msg: '修改失败', data: null });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const id = req.params.id;
        const addr = await UserAddress.findOne({ where: { id, user_id: req.user.id } });
        if (!addr) return res.status(404).json({ code: 404, msg: '地址不存在', data: null });
        await addr.destroy();
        await ensureUserAddressDefault(req.user.id);
        res.json({ code: 0, msg: 'ok', data: null });
    } catch (e) {
        console.error('删除地址失败:', e);
        res.status(500).json({ code: 500, msg: '删除失败', data: null });
    }
};

/** 供一次性数据回填脚本调用：按用户修正默认地址唯一性 */
exports.ensureUserAddressDefaultInternal = ensureUserAddressDefault;
