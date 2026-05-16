const { Op } = require('sequelize');
const { sequelize } = require('../models');

const HOME_TABLE = 'home_display_items';

async function query(sql, replacements = []) {
  const [rows] = await sequelize.query(sql, { replacements });
  return rows;
}

exports.listItems = async (req, res) => {
  try {
    const { kind, status, keyword, page = 1, pageSize = 50 } = req.query;
    let where = '1=1';
    const params = [];
    if (kind) { where += ' AND h.kind = ?'; params.push(kind); }
    if (status !== undefined && status !== '') { where += ' AND h.status = ?'; params.push(Number(status)); }
    if (keyword) { where += ' AND h.title LIKE ?'; params.push(`%${keyword}%`); }

    const countSql = `SELECT COUNT(*) as total FROM ${HOME_TABLE} h WHERE ${where}`;
    const [{ total }] = await query(countSql, params);

    const offset = (Number(page) - 1) * Number(pageSize);
    const dataSql = `SELECT h.* FROM ${HOME_TABLE} h WHERE ${where} ORDER BY h.sort DESC, h.id DESC LIMIT ? OFFSET ?`;
    const rows = await query(dataSql, [...params, Number(pageSize), offset]);

    res.json({ code: 0, data: { rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e) {
    console.error('homeDisplay listItems:', e);
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { kind, target_id, title, cover, description, sort, status, extra } = req.body;
    if (!kind || !target_id) return res.status(400).json({ code: -1, msg: 'kind和target_id必填' });

    const exists = await query(`SELECT id FROM ${HOME_TABLE} WHERE kind=? AND target_id=?`, [kind, target_id]);
    if (exists.length) return res.status(400).json({ code: -1, msg: '该项已存在' });

    const extraStr = extra ? JSON.stringify(extra) : null;
    await query(
      `INSERT INTO ${HOME_TABLE} (kind, target_id, title, cover, description, sort, status, extra) VALUES (?,?,?,?,?,?,?,?)`,
      [kind, Number(target_id), title || '', cover || '', description || '', sort || 0, status !== undefined ? Number(status) : 1, extraStr]
    );
    res.json({ code: 0, msg: '添加成功' });
  } catch (e) {
    console.error('homeDisplay createItem:', e);
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, cover, description, sort, status, extra } = req.body;
    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title=?'); params.push(title); }
    if (cover !== undefined) { sets.push('cover=?'); params.push(cover); }
    if (description !== undefined) { sets.push('description=?'); params.push(description); }
    if (sort !== undefined) { sets.push('sort=?'); params.push(Number(sort)); }
    if (status !== undefined) { sets.push('status=?'); params.push(Number(status)); }
    if (extra !== undefined) { sets.push('extra=?'); params.push(JSON.stringify(extra)); }
    if (!sets.length) return res.status(400).json({ code: -1, msg: '无更新字段' });
    params.push(Number(id));
    await query(`UPDATE ${HOME_TABLE} SET ${sets.join(',')} WHERE id=?`, params);
    res.json({ code: 0, msg: '更新成功' });
  } catch (e) {
    console.error('homeDisplay updateItem:', e);
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM ${HOME_TABLE} WHERE id=?`, [Number(id)]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (e) {
    console.error('homeDisplay deleteItem:', e);
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.searchWorkers = async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = `SELECT wp.id, wp.user_id, wp.real_name, wp.phone, wp.industry, wp.city, wp.status FROM worker_profiles wp WHERE wp.status='active'`;
    const params = [];
    if (keyword) { sql += ` AND (wp.real_name LIKE ? OR wp.phone LIKE ? OR wp.industry LIKE ?)`; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    sql += ' LIMIT 50';
    const rows = await query(sql, params);
    res.json({ code: 0, data: rows });
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.searchServices = async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = `SELECT s.id, s.title, s.price, s.cover_image, s.provider_id FROM Services s WHERE s.is_published=1`;
    const params = [];
    if (keyword) { sql += ` AND s.title LIKE ?`; params.push(`%${keyword}%`); }
    sql += ' LIMIT 50';
    const rows = await query(sql, params);
    res.json({ code: 0, data: rows });
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.searchServiceProviders = async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = `SELECT sp.id, sp.user_id, sp.shop_name, sp.contact_name, sp.phone, sp.status FROM service_provider_profiles sp WHERE sp.status='active'`;
    const params = [];
    if (keyword) { sql += ` AND (sp.shop_name LIKE ? OR sp.contact_name LIKE ?)`; params.push(`%${keyword}%`, `%${keyword}%`); }
    sql += ' LIMIT 50';
    const rows = await query(sql, params);
    res.json({ code: 0, data: rows });
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
};

exports.getPublicHomeItems = async (req, res) => {
  try {
    const { kind } = req.query;
    let where = 'h.status = 1';
    const params = [];
    if (kind) { where += ' AND h.kind = ?'; params.push(kind); }
    const rows = await query(`SELECT h.* FROM ${HOME_TABLE} h WHERE ${where} ORDER BY h.sort DESC, h.id DESC LIMIT 100`, params);
    res.json({ code: 0, data: rows });
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
};
