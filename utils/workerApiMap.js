/**
 * 直约技工：接口行 → 展示模型（首页横滑、分类列表、详情共用头像与姓名字段规则）
 */
const { imgUrl } = require('./util.js');
const { workerAvatarUrl } = require('./workerAvatars.js');

// 本地兜底技工数据（后端 core/workers 不可用时，首页列表与详情页共用）
const FALLBACK_WORKER_ROWS = [
  { id: 1, name: '何师傅', gender: '♂', service_count: 128, exp: 10, region: '杭州市', desc: '擅长水电维修、管道疏通、灯具安装，10年从业经验，服务周到。', tags: ['水电维修', '管道疏通'] },
  { id: 2, name: '李师傅', gender: '♀', service_count: 86,  exp: 5,  region: '杭州市', desc: '专业保洁、开荒清洁、家电清洗，工具齐全，准时上门。', tags: ['保洁清洗', '开荒清洁'] },
  { id: 3, name: '张师傅', gender: '♂', service_count: 203, exp: 15, region: '杭州市', desc: '家具安装、墙面刷新、瓷砖铺贴，手艺精湛，质保一年。', tags: ['家具安装', '墙面刷新'] },
  { id: 4, name: '王师傅', gender: '♂', service_count: 56,  exp: 8,  region: '杭州市', desc: '空调维修、油烟机清洗、热水器安装，持证上岗。', tags: ['空调维修', '家电清洗'] },
  { id: 5, name: '刘师傅', gender: '♀', service_count: 92,  exp: 12, region: '杭州市', desc: '月嫂育儿、老人陪护、家庭管家，耐心细致，口碑好。', tags: ['月嫂育儿', '老人陪护'] },
  { id: 6, name: '陈师傅', gender: '♂', service_count: 167, exp: 6,  region: '杭州市', desc: '搬家搬运、重物上楼、拆装家具，力大心细，价格公道。', tags: ['搬家搬运', '拆装家具'] }
];

// 各技工对应的服务项目兜底（详情页服务列表）
const FALLBACK_WORKER_GOODS = {
  1: [
    { id: 101, name: '家庭电路故障维修【1小时】', price: '169元/次' },
    { id: 102, name: '厨房/卫浴管道疏通【1小时】', price: '158元/次' },
    { id: 103, name: '灯具线路与灯体维修【1小时】', price: '98元/次' }
  ],
  2: [
    { id: 201, name: '全屋深度开荒【4小时】', price: '499元/次' },
    { id: 202, name: '新房开荒保洁【3小时】', price: '399元/次' },
    { id: 203, name: '油烟机拆洗【1小时】', price: '159元/次' }
  ],
  3: [
    { id: 301, name: '局部瓷砖铺贴【2小时】', price: '229元/次' },
    { id: 302, name: '墙面刷新施工【2小时】', price: '259元/次' },
    { id: 303, name: '柜门铰链滑轨维修【1小时】', price: '118元/次' }
  ],
  4: [
    { id: 401, name: '空调深度清洗【1小时】', price: '129元/次' },
    { id: 402, name: '热水器内胆清洗【1小时】', price: '139元/次' },
    { id: 403, name: '油烟机拆洗【1小时】', price: '159元/次' }
  ],
  5: [
    { id: 501, name: '专业育儿嫂上门【3小时】', price: '199元/次' },
    { id: 502, name: '儿童起居照顾【2小时】', price: '99元/次' },
    { id: 503, name: '校区接送小孩【1小时】', price: '39元/次' }
  ],
  6: [
    { id: 601, name: '搬家打包复原整理【2小时】', price: '216元/次' },
    { id: 602, name: '日式打包复原整理【2小时】', price: '216元/次' },
    { id: 603, name: '零星打胶与家修杂事【1小时】', price: '99元/次' }
  ]
};

function pickRawAvatarPath(w) {
  if (!w || typeof w !== 'object') return '';
  const tryVal = (v) => {
    if (v == null) return '';
    const s = String(v).trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    return s;
  };
  const keys = [
    'avatar_url',
    'avatar',
    'head_img',
    'headImg',
    'headimgurl',
    'photo',
    'portrait',
    'cover_image',
    'user_avatar',
    'image',
    'face_url'
  ];
  for (let i = 0; i < keys.length; i++) {
    const s = tryVal(w[keys[i]]);
    if (s) return s;
  }
  const u = w.user || w.User;
  if (u && typeof u === 'object') {
    const s = tryVal(u.avatar_url || u.avatar || u.headimgurl);
    if (s) return s;
  }
  return '';
}

function isBrokenImageUrl(url) {
  if (url == null) return true;
  const s = String(url).trim();
  if (!s) return true;
  if (s.startsWith('data:image/gif')) return true;
  if (/example\.com/i.test(s)) return true;
  if (/127\.0\.0\.1/i.test(s) && /\/uploads\//i.test(s)) return true;
  return false;
}

function pickWorkerAvatar(w) {
  if (!w || typeof w !== 'object') {
    return workerAvatarUrl(0);
  }
  const stableId = w.id != null ? w.id : w.worker_id || w.user_id || 0;
  const av = pickRawAvatarPath(w);
  if (!av) return workerAvatarUrl(stableId);
  const resolved = imgUrl(av);
  if (isBrokenImageUrl(resolved)) {
    return workerAvatarUrl(stableId);
  }
  return resolved;
}

/** 男/女展示（与后端 gender 枚举对齐） */
function genderToLabel(g) {
  if (g == null || g === '') return '';
  const s = String(g).trim().toLowerCase();
  if (['m', 'male', '1', '男'].includes(s)) return '男';
  if (['f', 'female', '2', '女'].includes(s)) return '女';
  if (s === '♂' || g === '♂') return '男';
  if (s === '♀' || g === '♀') return '女';
  return '';
}

/** 首页「直约技工」横滑卡片：头像、姓名、性别、简介摘要、主要方向、服务单数 */
function mapWorkerForHomeCard(w) {
  const cnt =
    w.service_count != null
      ? w.service_count
      : w.serviceCount != null
        ? w.serviceCount
        : w.order_count;
  const ordersText = cnt != null ? `服务${cnt}单` : w.orders || '服务0单';
  const rawDesc = w.desc || w.resume || w.introduction || w.bio || '';
  const intro =
    rawDesc.length > 40 ? String(rawDesc).slice(0, 40) + '…' : String(rawDesc || '');
  const mainDirection =
    w.main_direction ||
    w.specialty ||
    w.main_skill ||
    (Array.isArray(w.tags) && w.tags.length ? w.tags[0] : '') ||
    '到家服务';
  const idStr = w.id != null ? String(w.id) : '';
  return {
    id: idStr,
    idStr,
    name: w.name || w.real_name || w.nickname || '技工',
    orders: ordersText,
    avatar: pickWorkerAvatar(w),
    genderLabel: genderToLabel(w.gender),
    intro,
    mainDirection: String(mainDirection).slice(0, 12)
  };
}

/** 分类页「全部技工」列表卡片 */
function mapWorkerForClassifyCard(w) {
  const idStr = w.id != null ? String(w.id) : '';
  return {
    id: idStr,
    idStr,
    name: w.name || w.real_name || w.nickname || '技工',
    region: w.region || w.city || w.hometown || '',
    gender: w.gender || '',
    serviceCount: Number(w.serviceCount || w.service_count || w.orders || 0) || 0,
    exp: Number(w.exp || w.work_years || w.workExp || 0) || 0,
    desc: w.desc || w.resume || '',
    tags: Array.isArray(w.tags) ? w.tags : [],
    avatar: pickWorkerAvatar(w)
  };
}

module.exports = {
  pickWorkerAvatar,
  genderToLabel,
  mapWorkerForHomeCard,
  mapWorkerForClassifyCard,
  FALLBACK_WORKER_ROWS,
  FALLBACK_WORKER_GOODS
};
