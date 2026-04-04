/**
 * 服务详情页兜底数据：具体服务名称与文案（与 pages/service/service.js 原 mockMap 一致）
 * 图片键名对应 utils/images.js 导出字段；主图优先使用 首页素材/3 同步目录（见 utils/serviceHome3.js）
 */

const { home3PathForTitle } = require('./serviceHome3.js');

const TAG_SET_KEYS = {
  default: 'default',
  tidy: 'tidy',
  repair: 'repair',
  clean: 'clean',
  beauty: 'beauty'
};

/**
 * id -> { title, subTitle, price, spec, desc, banner, detailImages, tagSet }
 * banner / detailImages 为 images 对象上的键名字符串
 */
const SERVICE_ENTRIES = {
  1: { title: '衣橱整理收纳【2小时】', subTitle: '衣橱整理收纳（2小时）', price: 196, spec: '2小时/份', desc: '包含衣橱分类、折叠、收纳布局优化与简单清洁。', banner: 'svcTidyCloset', detailImages: ['svcTidyCloset', 'catTidy'], tagSet: TAG_SET_KEYS.tidy },
  2: { title: '厨房整理收纳【2小时】', subTitle: '厨房整理收纳（2小时）', price: 196, spec: '2小时/份', desc: '厨房锅碗瓢盆归位整理，橱柜内部重新规划收纳布局。', banner: 'svcTidyKitchen', detailImages: ['svcTidyKitchen', 'catTidy'], tagSet: TAG_SET_KEYS.tidy },
  3: { title: '日式打包复原整理【2小时】', subTitle: '日式打包复原整理（2小时）', price: 216, spec: '2小时/份', desc: '搬家前后整理打包，物品按类归位，快速还原居家秩序。', banner: 'svcTidyPacking', detailImages: ['svcTidyPacking', 'catTidy'], tagSet: TAG_SET_KEYS.tidy },
  4: { title: '全屋整理收纳【3小时】', subTitle: '全屋整理收纳（3小时）', price: 292, spec: '3小时/份', desc: '全屋各区域分类整理，收纳布局重规划，提升居家空间利用率。', banner: 'svcTidyFullRoom', detailImages: ['svcTidyFullRoom', 'svcTidyCloset'], tagSet: TAG_SET_KEYS.tidy },
  5: { title: '全屋整理收纳【4小时】', subTitle: '全屋整理收纳（4小时）', price: 385, spec: '4小时/份', desc: '深度全屋整理，含衣橱、厨房、书房等多区联动规划。', banner: 'svcTidyFullRoom', detailImages: ['svcTidyFullRoom', 'svcTidyKitchen'], tagSet: TAG_SET_KEYS.tidy },
  11: { title: '净水器故障维修【1小时】', subTitle: '净水器故障维修（1小时）', price: 128, spec: '1小时/次', desc: '净水器漏水、不出水、滤芯更换等故障上门排查修复。', banner: 'svcRepairGeneral', detailImages: ['svcRepairGeneral', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  12: { title: '灯具线路与灯体维修【1小时】', subTitle: '灯具线路与灯体维修（1小时）', price: 98, spec: '1小时/次', desc: '各类家用灯具故障排查、线路检测与灯体部件更换。', banner: 'svcRepairElec', detailImages: ['svcRepairElec', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  13: { title: '柜门铰链滑轨维修【1小时】', subTitle: '柜门铰链滑轨维修（1小时）', price: 118, spec: '1小时/次', desc: '橱柜、衣柜门铰链松动、脱落、滑轨卡顿上门修复。', banner: 'svcRepairGeneral', detailImages: ['svcRepairGeneral', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  14: { title: '厨房/卫浴管道疏通【1小时】', subTitle: '厨房/卫浴管道疏通（1小时）', price: 158, spec: '1小时/次', desc: '厨房下水道、卫浴排水管堵塞专业疏通，不通不收费。', banner: 'svcRepairWater', detailImages: ['svcRepairWater', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  15: { title: '上门手机维修【1小时】', subTitle: '上门手机维修（1小时）', price: 129, spec: '1小时/次', desc: '手机屏幕碎裂、无法开机、充电故障等常见问题上门修复。', banner: 'svcRepairGeneral', detailImages: ['svcRepairGeneral', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  16: { title: '家庭电路故障维修【1小时】', subTitle: '家庭电路故障维修（1小时）', price: 169, spec: '1小时/次', desc: '跳闸、断路、插座失灵等家用电路故障专业检修。', banner: 'svcRepairElec', detailImages: ['svcRepairElec', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  17: { title: '家庭水路维修【1小时】', subTitle: '家庭水路维修（1小时）', price: 159, spec: '1小时/次', desc: '水管漏水、水龙头滴水、阀门损坏等水路问题上门修复。', banner: 'svcRepairWater', detailImages: ['svcRepairWater', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  18: { title: '马桶维修与配件更换【1小时】', subTitle: '马桶维修与配件更换（1小时）', price: 139, spec: '1小时/次', desc: '马桶漏水、冲水异常、配件老化更换等上门专业维修。', banner: 'svcRepairWater', detailImages: ['svcRepairWater', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  19: { title: '厨房烟道串味治理【1小时】', subTitle: '厨房烟道串味治理（1小时）', price: 179, spec: '1小时/次', desc: '厨房烟道反味、串味问题检测，安装止逆阀等专业处理。', banner: 'svcHood', detailImages: ['svcHood', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  20: { title: '零星打胶与家修杂事【1小时】', subTitle: '零星打胶与家修杂事（1小时）', price: 99, spec: '1小时/次', desc: '瓷砖缝打胶、墙面小修小补等各类居家零星维修事项。', banner: 'svcRepairGeneral', detailImages: ['svcRepairGeneral', 'catUrgentFix'], tagSet: TAG_SET_KEYS.repair },
  21: { title: '全屋漏水点检测【1小时】', subTitle: '全屋漏水点检测（1小时）', price: 129, spec: '1小时/次', desc: '专业设备检测全屋隐蔽漏水点，出具检测报告。', banner: 'svcRepairWater', detailImages: ['svcRepairWater', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  22: { title: '瓷砖空鼓排查检测【1小时】', subTitle: '瓷砖空鼓排查检测（1小时）', price: 109, spec: '1小时/次', desc: '全屋地墙砖空鼓情况专业排查，标记问题区域并建议处理方案。', banner: 'svcTile', detailImages: ['svcTile', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  23: { title: '地暖回路检测【1小时】', subTitle: '地暖回路检测（1小时）', price: 139, spec: '1小时/次', desc: '地暖管路压力检测、分区流量测试，判断堵塞或漏水位置。', banner: 'svcFloor', detailImages: ['svcFloor', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  24: { title: '地暖管路清洗【2小时】', subTitle: '地暖管路清洗（2小时）', price: 269, spec: '2小时/次', desc: '专业设备冲洗地暖管路，清除水垢与杂质，恢复供热效率。', banner: 'svcFloor', detailImages: ['svcFloor', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  25: { title: '灯具深度清洗【1小时】', subTitle: '灯具深度清洗（1小时）', price: 99, spec: '1小时/次', desc: '吊灯、吸顶灯等各类灯具拆卸深度清洁，复原安装。', banner: 'svcRepairElec', detailImages: ['svcRepairElec', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  26: { title: '空调深度清洗【1小时】', subTitle: '空调深度清洗（1小时）', price: 129, spec: '1小时/次', desc: '挂壁式空调高温蒸汽深度清洗，拆洗过滤网、导风板，去除异味。', banner: 'svcAircon', detailImages: ['svcAircon', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  27: { title: '油烟机拆洗【1小时】', subTitle: '油烟机拆洗（1小时）', price: 159, spec: '1小时/次', desc: '专业拆洗油网、风轮，高温溶油去污，恢复吸力。', banner: 'svcHood', detailImages: ['svcHood', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  28: { title: '洗衣机桶内清洗【1小时】', subTitle: '洗衣机桶内清洗（1小时）', price: 149, spec: '1小时/次', desc: '专业拆洗内桶，高温消毒除霉，恢复洁净如新。', banner: 'svcWasher', detailImages: ['svcWasher', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  29: { title: '冰箱除菌清洗【1小时】', subTitle: '冰箱除菌清洗（1小时）', price: 119, spec: '1小时/次', desc: '冰箱内外深度清洁，除菌除味，清理密封条与冷凝器。', banner: 'svcFridge', detailImages: ['svcFridge', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  30: { title: '热水器内胆清洗【1小时】', subTitle: '热水器内胆清洗（1小时）', price: 139, spec: '1小时/次', desc: '电热水器内胆除垢清洗，延长使用寿命，改善热水质量。', banner: 'svcFridge', detailImages: ['svcFridge', 'catApplianceClean'], tagSet: TAG_SET_KEYS.clean },
  31: { title: '新房开荒保洁【3小时】', subTitle: '新房开荒保洁（3小时）', price: 399, spec: '3小时/份', desc: '新房交付后全屋开荒保洁，去除装修污垢、水泥点、胶迹。', banner: 'svcDeepClean', detailImages: ['svcDeepClean', 'catPioneerClean'], tagSet: TAG_SET_KEYS.default },
  32: { title: '全屋深度开荒【4小时】', subTitle: '全屋深度开荒（4小时）', price: 499, spec: '4小时/份', desc: '全屋深度开荒，含擦窗、除胶点漆点，适合120平以上大户型。', banner: 'svcDeepClean', detailImages: ['svcDeepClean', 'catPioneerClean'], tagSet: TAG_SET_KEYS.default },
  41: { title: '全床深度除螨【1小时】', subTitle: '全床深度除螨（1小时）', price: 139, spec: '1小时/次', desc: '专业除螨仪高频振动吸取床垫螨虫，紫外线杀菌消毒。', banner: 'svcMattress', detailImages: ['svcMattress', 'catMiteRemove'], tagSet: TAG_SET_KEYS.clean },
  42: { title: '居室除螨净化【2小时】', subTitle: '居室除螨净化（2小时）', price: 239, spec: '2小时/次', desc: '全室地毯、沙发、床垫联合除螨，空气净化处理。', banner: 'svcMattress', detailImages: ['svcMattress', 'svcCarpet'], tagSet: TAG_SET_KEYS.clean },
  51: { title: '木地板翻新养护【2小时】', subTitle: '木地板翻新养护（2小时）', price: 299, spec: '2小时/次', desc: '实木/复合地板打磨、补色、上蜡，恢复光泽保护木质。', banner: 'svcFloor', detailImages: ['svcFloor', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  52: { title: '地暖系统检测【1小时】', subTitle: '地暖系统检测（1小时）', price: 139, spec: '1小时/次', desc: '地暖各回路温度与流量检测，定位效率低下或故障区域。', banner: 'svcFloor', detailImages: ['svcFloor', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.repair },
  53: { title: '地暖系统清洁【2小时】', subTitle: '地暖系统清洁（2小时）', price: 269, spec: '2小时/次', desc: '地暖管路专业清洁，清除水垢与沉淀物，恢复供暖效率。', banner: 'svcFloor', detailImages: ['svcFloor', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  54: { title: '床垫深度清洗除菌【1小时】', subTitle: '床垫深度清洗除菌（1小时）', price: 169, spec: '1小时/次', desc: '床垫专业喷洗除螨除菌，高温蒸汽处理，晾干后复原铺放。', banner: 'svcMattress', detailImages: ['svcMattress', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  55: { title: '布艺/皮质沙发清洗【1小时】', subTitle: '布艺/皮质沙发清洗（1小时）', price: 179, spec: '1小时/次', desc: '布艺沙发深度清洁去污，皮质沙发护理上光，延长使用寿命。', banner: 'svcSofa', detailImages: ['svcSofa', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  56: { title: '窗帘清洁养护【1小时】', subTitle: '窗帘清洁养护（1小时）', price: 129, spec: '1小时/次', desc: '窗帘拆洗或上门清洁，去除灰尘与污渍，复原安装。', banner: 'svcDeepClean', detailImages: ['svcDeepClean', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  57: { title: '地毯深度清洗【1小时】', subTitle: '地毯深度清洗（1小时）', price: 159, spec: '1小时/次', desc: '地毯专业喷洗除污，去异味除螨，快速晾干处理。', banner: 'svcCarpet', detailImages: ['svcCarpet', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  58: { title: '地板打蜡养护【1小时】', subTitle: '地板打蜡养护（1小时）', price: 149, spec: '1小时/次', desc: '地板清洁后专业打蜡，形成保护膜，防刮防潮延长寿命。', banner: 'svcFloor', detailImages: ['svcFloor', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  59: { title: '大理石抛光养护【2小时】', subTitle: '大理石抛光养护（2小时）', price: 229, spec: '2小时/次', desc: '大理石台面、地面专业研磨抛光，去除划痕恢复镜面光泽。', banner: 'svcFloor', detailImages: ['svcFloor', 'catFurnitureCare'], tagSet: TAG_SET_KEYS.clean },
  61: { title: '校区接送小孩【1小时】', subTitle: '校区接送小孩（1小时）', price: 39, spec: '1小时/次', desc: '专业人员按时接送孩子上下学，全程安全有保障。', banner: 'svcKids', detailImages: ['svcKids', 'catBabyHome'], tagSet: TAG_SET_KEYS.default },
  62: { title: '课后陪读辅导【2小时】', subTitle: '课后陪读辅导（2小时）', price: 89, spec: '2小时/次', desc: '专业辅导老师陪同完成作业，答疑解惑，培养学习习惯。', banner: 'svcKids', detailImages: ['svcKids', 'catBabyHome'], tagSet: TAG_SET_KEYS.default },
  63: { title: '儿童起居照顾【2小时】', subTitle: '儿童起居照顾（2小时）', price: 99, spec: '2小时/次', desc: '专业人员负责孩子日常起居照料，含洗漱、喂饭、陪玩。', banner: 'svcBaby', detailImages: ['svcBaby', 'catBabyHome'], tagSet: TAG_SET_KEYS.default },
  64: { title: '专业育儿嫂上门【3小时】', subTitle: '专业育儿嫂上门（3小时）', price: 199, spec: '3小时/次', desc: '持证育儿嫂上门服务，科学护理婴幼儿，指导家长育儿技巧。', banner: 'svcBaby', detailImages: ['svcBaby', 'catBabyHome'], tagSet: TAG_SET_KEYS.default },
  71: { title: '岩板破损修复【1小时】', subTitle: '岩板破损修复（1小时）', price: 199, spec: '1小时/次', desc: '岩板台面、墙面裂缝、崩角专业色釉修复，肉眼近乎无痕。', banner: 'svcTile', detailImages: ['svcTile', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  72: { title: '瓷砖裂纹修复【1小时】', subTitle: '瓷砖裂纹修复（1小时）', price: 159, spec: '1小时/次', desc: '地墙砖裂纹、崩角修复，色釉调色处理，不影响正常使用。', banner: 'svcTile', detailImages: ['svcTile', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  73: { title: '局部瓷砖铺贴【2小时】', subTitle: '局部瓷砖铺贴（2小时）', price: 229, spec: '2小时/次', desc: '局部瓷砖脱落或更换铺贴，含切割、上砖、勾缝处理。', banner: 'svcTile', detailImages: ['svcTile', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  74: { title: '壁纸铺贴施工【2小时】', subTitle: '壁纸铺贴施工（2小时）', price: 239, spec: '2小时/次', desc: '壁纸局部或整体铺贴施工，裁剪精准，接缝平整无气泡。', banner: 'svcWall', detailImages: ['svcWall', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  75: { title: '厨卫漏水防水修缮【2小时】', subTitle: '厨卫漏水防水修缮（2小时）', price: 299, spec: '2小时/次', desc: '厨房卫生间漏水点定位，防水层修缮处理，闭水试验合格。', banner: 'svcWaterproof', detailImages: ['svcWaterproof', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  76: { title: '地板铺贴修缮【2小时】', subTitle: '地板铺贴修缮（2小时）', price: 279, spec: '2小时/次', desc: '木地板起翘、脱胶、破损局部修缮，含补色收边处理。', banner: 'svcFloor', detailImages: ['svcFloor', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  77: { title: '墙面刷新施工【2小时】', subTitle: '墙面刷新施工（2小时）', price: 259, spec: '2小时/次', desc: '墙面旧漆清除、腻子找平后重新刷涂料，焕新墙面。', banner: 'svcWall', detailImages: ['svcWall', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  78: { title: '墙面修补刷新【2小时】', subTitle: '墙面修补刷新（2小时）', price: 269, spec: '2小时/次', desc: '墙面局部开裂、脱落修补，补色处理，与原墙面颜色匹配。', banner: 'svcWall', detailImages: ['svcWall', 'catHouseRepair'], tagSet: TAG_SET_KEYS.repair },
  81: { title: '上门纹绣咨询与设计【1小时】', subTitle: '上门纹绣咨询与设计（1小时）', price: 299, spec: '1小时/次', desc: '专业纹绣师上门根据面部特征设计眉形、眼线等方案，提供咨询与设计服务。', banner: 'svcMakeup', detailImages: ['svcMakeup', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty },
  82: { title: '上门面部护理美容【1小时】', subTitle: '上门面部护理美容（1小时）', price: 169, spec: '1小时/次', desc: '专业美容师上门提供洁面、补水、按摩等面部基础护理服务。', banner: 'svcMakeup', detailImages: ['svcMakeup', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty },
  83: { title: '活动化妆造型【1小时】', subTitle: '活动化妆造型（1小时）', price: 199, spec: '1小时/次', desc: '专业化妆师上门提供婚礼、宴会、拍照等场合定制妆造。', banner: 'svcMakeup', detailImages: ['svcMakeup', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty },
  84: { title: '上门美甲基础款【1小时】', subTitle: '上门美甲基础款（1小时）', price: 129, spec: '1小时/次', desc: '专业美甲师上门提供单色、法式等基础美甲服务。', banner: 'svcNail', detailImages: ['svcNail', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty },
  85: { title: '上门美瞳搭配服务【1小时】', subTitle: '上门美瞳搭配服务（1小时）', price: 159, spec: '1小时/次', desc: '专业顾问根据肤色、妆容推荐美瞳颜色，提供试戴与护理指导。', banner: 'svcMakeup', detailImages: ['svcMakeup', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty },
  86: { title: '上门美发造型服务【1小时】', subTitle: '上门美发造型服务（1小时）', price: 189, spec: '1小时/次', desc: '专业发型师上门提供剪发、造型、吹拉等美发服务。', banner: 'svcHair', detailImages: ['svcHair', 'catBeautyHome'], tagSet: TAG_SET_KEYS.beauty }
};

/** 仅服务主标题，便于其它页面引用或检索 */
const SERVICE_TITLES_BY_ID = Object.fromEntries(
  Object.keys(SERVICE_ENTRIES).map((k) => [Number(k), SERVICE_ENTRIES[k].title])
);

/**
 * @param {object} images - utils/images.js 导出对象
 * @param {object} tagSets - { default, tidy, repair, clean, beauty } 各为 string[]
 */
function buildServiceMockMap(images, tagSets) {
  const map = {};
  Object.keys(SERVICE_ENTRIES).forEach((k) => {
    const id = Number(k);
    const e = SERVICE_ENTRIES[id];
    const tags = tagSets[e.tagSet] || tagSets.default;
    const home3 = home3PathForTitle(e.title);
    const restDetailKeys = e.detailImages.slice(1);
    map[id] = {
      title: e.title,
      subTitle: e.subTitle,
      price: e.price,
      banner: home3 || images[e.banner],
      tags,
      spec: e.spec,
      desc: e.desc,
      detailImages: home3
        ? [home3, ...restDetailKeys.map((key) => images[key])]
        : e.detailImages.map((key) => images[key])
    };
  });
  return map;
}

module.exports = {
  SERVICE_ENTRIES,
  SERVICE_TITLES_BY_ID,
  buildServiceMockMap,
  TAG_SET_KEYS
};
