const util = require('../../utils/util.js');
const { imgUrl } = util;
const images = require('../../utils/images.js');

Page({
  data: {
    navTopPadding: 20,
    serviceId: 1,
    service: {},
    specs: [],
    detailImages: [],
    descText: ""
  },
  async onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number(options.id || 1);
    this.setData({ serviceId: id });

    const _tags      = ["无额外收费", "未服务随时退", "不满意重服务"];
    const _tidyTags  = ["标准计时", "专业整理", "不满意重服务"];
    const _repairTags = ["上门服务", "专业工具", "不满意不收费"];
    const _cleanTags = ["专业清洗", "高温除菌", "不满意重洗"];
    const _beautyTags = ["上门服务", "专业技师", "不满意重做"];

    const mockMap = {
      // ── 整理收纳 (tidy) ──
      1:  { title: "衣橱整理收纳【2小时】",       subTitle: "衣橱整理收纳（2小时）",       price: 196, banner: images.svcTidyCloset,    tags: _tidyTags,   spec: "2小时/份",  desc: "包含衣橱分类、折叠、收纳布局优化与简单清洁。",               detailImages: [images.svcTidyCloset, images.catTidy] },
      2:  { title: "厨房整理收纳【2小时】",       subTitle: "厨房整理收纳（2小时）",       price: 196, banner: images.svcTidyKitchen,   tags: _tidyTags,   spec: "2小时/份",  desc: "厨房锅碗瓢盆归位整理，橱柜内部重新规划收纳布局。",           detailImages: [images.svcTidyKitchen, images.catTidy] },
      3:  { title: "日式打包复原整理【2小时】",   subTitle: "日式打包复原整理（2小时）",   price: 216, banner: images.svcTidyPacking,   tags: _tidyTags,   spec: "2小时/份",  desc: "搬家前后整理打包，物品按类归位，快速还原居家秩序。",         detailImages: [images.svcTidyPacking, images.catTidy] },
      4:  { title: "全屋整理收纳【3小时】",       subTitle: "全屋整理收纳（3小时）",       price: 292, banner: images.svcTidyFullRoom,  tags: _tidyTags,   spec: "3小时/份",  desc: "全屋各区域分类整理，收纳布局重规划，提升居家空间利用率。",   detailImages: [images.svcTidyFullRoom, images.svcTidyCloset] },
      5:  { title: "全屋整理收纳【4小时】",       subTitle: "全屋整理收纳（4小时）",       price: 385, banner: images.svcTidyFullRoom,  tags: _tidyTags,   spec: "4小时/份",  desc: "深度全屋整理，含衣橱、厨房、书房等多区联动规划。",           detailImages: [images.svcTidyFullRoom, images.svcTidyKitchen] },
      // ── 家修急事 (urgent_fix) ──
      11: { title: "净水器故障维修【1小时】",     subTitle: "净水器故障维修（1小时）",     price: 128, banner: images.svcRepairGeneral, tags: _repairTags, spec: "1小时/次",  desc: "净水器漏水、不出水、滤芯更换等故障上门排查修复。",           detailImages: [images.svcRepairGeneral, images.catUrgentFix] },
      12: { title: "灯具线路与灯体维修【1小时】", subTitle: "灯具线路与灯体维修（1小时）", price: 98,  banner: images.svcRepairElec,    tags: _repairTags, spec: "1小时/次",  desc: "各类家用灯具故障排查、线路检测与灯体部件更换。",             detailImages: [images.svcRepairElec, images.catUrgentFix] },
      13: { title: "柜门铰链滑轨维修【1小时】",   subTitle: "柜门铰链滑轨维修（1小时）",   price: 118, banner: images.svcRepairGeneral, tags: _repairTags, spec: "1小时/次",  desc: "橱柜、衣柜门铰链松动、脱落、滑轨卡顿上门修复。",             detailImages: [images.svcRepairGeneral, images.catUrgentFix] },
      14: { title: "厨房/卫浴管道疏通【1小时】", subTitle: "厨房/卫浴管道疏通（1小时）", price: 158, banner: images.svcRepairWater,   tags: _repairTags, spec: "1小时/次",  desc: "厨房下水道、卫浴排水管堵塞专业疏通，不通不收费。",           detailImages: [images.svcRepairWater, images.catUrgentFix] },
      15: { title: "上门手机维修【1小时】",       subTitle: "上门手机维修（1小时）",       price: 129, banner: images.svcRepairGeneral, tags: _repairTags, spec: "1小时/次",  desc: "手机屏幕碎裂、无法开机、充电故障等常见问题上门修复。",       detailImages: [images.svcRepairGeneral, images.catUrgentFix] },
      16: { title: "家庭电路故障维修【1小时】",   subTitle: "家庭电路故障维修（1小时）",   price: 169, banner: images.svcRepairElec,    tags: _repairTags, spec: "1小时/次",  desc: "跳闸、断路、插座失灵等家用电路故障专业检修。",               detailImages: [images.svcRepairElec, images.catUrgentFix] },
      17: { title: "家庭水路维修【1小时】",       subTitle: "家庭水路维修（1小时）",       price: 159, banner: images.svcRepairWater,   tags: _repairTags, spec: "1小时/次",  desc: "水管漏水、水龙头滴水、阀门损坏等水路问题上门修复。",         detailImages: [images.svcRepairWater, images.catUrgentFix] },
      18: { title: "马桶维修与配件更换【1小时】", subTitle: "马桶维修与配件更换（1小时）", price: 139, banner: images.svcRepairWater,   tags: _repairTags, spec: "1小时/次",  desc: "马桶漏水、冲水异常、配件老化更换等上门专业维修。",           detailImages: [images.svcRepairWater, images.catUrgentFix] },
      19: { title: "厨房烟道串味治理【1小时】",   subTitle: "厨房烟道串味治理（1小时）",   price: 179, banner: images.svcHood,          tags: _repairTags, spec: "1小时/次",  desc: "厨房烟道反味、串味问题检测，安装止逆阀等专业处理。",         detailImages: [images.svcHood, images.catUrgentFix] },
      20: { title: "零星打胶与家修杂事【1小时】", subTitle: "零星打胶与家修杂事（1小时）", price: 99,  banner: images.svcRepairGeneral, tags: _repairTags, spec: "1小时/次",  desc: "瓷砖缝打胶、墙面小修小补等各类居家零星维修事项。",           detailImages: [images.svcRepairGeneral, images.catUrgentFix] },
      // ── 家电清洗 (appliance_clean) ──
      21: { title: "全屋漏水点检测【1小时】",     subTitle: "全屋漏水点检测（1小时）",     price: 129, banner: images.svcRepairWater,   tags: _cleanTags,  spec: "1小时/次",  desc: "专业设备检测全屋隐蔽漏水点，出具检测报告。",                 detailImages: [images.svcRepairWater, images.catApplianceClean] },
      22: { title: "瓷砖空鼓排查检测【1小时】",   subTitle: "瓷砖空鼓排查检测（1小时）",   price: 109, banner: images.svcTile,          tags: _cleanTags,  spec: "1小时/次",  desc: "全屋地墙砖空鼓情况专业排查，标记问题区域并建议处理方案。",   detailImages: [images.svcTile, images.catApplianceClean] },
      23: { title: "地暖回路检测【1小时】",       subTitle: "地暖回路检测（1小时）",       price: 139, banner: images.svcFloor,         tags: _cleanTags,  spec: "1小时/次",  desc: "地暖管路压力检测、分区流量测试，判断堵塞或漏水位置。",       detailImages: [images.svcFloor, images.catApplianceClean] },
      24: { title: "地暖管路清洗【2小时】",       subTitle: "地暖管路清洗（2小时）",       price: 269, banner: images.svcFloor,         tags: _cleanTags,  spec: "2小时/次",  desc: "专业设备冲洗地暖管路，清除水垢与杂质，恢复供热效率。",       detailImages: [images.svcFloor, images.catApplianceClean] },
      25: { title: "灯具深度清洗【1小时】",       subTitle: "灯具深度清洗（1小时）",       price: 99,  banner: images.svcRepairElec,    tags: _cleanTags,  spec: "1小时/次",  desc: "吊灯、吸顶灯等各类灯具拆卸深度清洁，复原安装。",             detailImages: [images.svcRepairElec, images.catApplianceClean] },
      26: { title: "空调深度清洗【1小时】",       subTitle: "空调深度清洗（1小时）",       price: 129, banner: images.svcAircon,        tags: _cleanTags,  spec: "1小时/次",  desc: "挂壁式空调高温蒸汽深度清洗，拆洗过滤网、导风板，去除异味。", detailImages: [images.svcAircon, images.catApplianceClean] },
      27: { title: "油烟机拆洗【1小时】",         subTitle: "油烟机拆洗（1小时）",         price: 159, banner: images.svcHood,          tags: _cleanTags,  spec: "1小时/次",  desc: "专业拆洗油网、风轮，高温溶油去污，恢复吸力。",               detailImages: [images.svcHood, images.catApplianceClean] },
      28: { title: "洗衣机桶内清洗【1小时】",     subTitle: "洗衣机桶内清洗（1小时）",     price: 149, banner: images.svcWasher,        tags: _cleanTags,  spec: "1小时/次",  desc: "专业拆洗内桶，高温消毒除霉，恢复洁净如新。",                 detailImages: [images.svcWasher, images.catApplianceClean] },
      29: { title: "冰箱除菌清洗【1小时】",       subTitle: "冰箱除菌清洗（1小时）",       price: 119, banner: images.svcFridge,        tags: _cleanTags,  spec: "1小时/次",  desc: "冰箱内外深度清洁，除菌除味，清理密封条与冷凝器。",           detailImages: [images.svcFridge, images.catApplianceClean] },
      30: { title: "热水器内胆清洗【1小时】",     subTitle: "热水器内胆清洗（1小时）",     price: 139, banner: images.svcFridge,        tags: _cleanTags,  spec: "1小时/次",  desc: "电热水器内胆除垢清洗，延长使用寿命，改善热水质量。",         detailImages: [images.svcFridge, images.catApplianceClean] },
      // ── 开荒保洁 (pioneer_clean) ──
      31: { title: "新房开荒保洁【3小时】",       subTitle: "新房开荒保洁（3小时）",       price: 399, banner: images.svcDeepClean,     tags: _tags,       spec: "3小时/份",  desc: "新房交付后全屋开荒保洁，去除装修污垢、水泥点、胶迹。",       detailImages: [images.svcDeepClean, images.catPioneerClean] },
      32: { title: "全屋深度开荒【4小时】",       subTitle: "全屋深度开荒（4小时）",       price: 499, banner: images.svcDeepClean,     tags: _tags,       spec: "4小时/份",  desc: "全屋深度开荒，含擦窗、除胶点漆点，适合120平以上大户型。",   detailImages: [images.svcDeepClean, images.catPioneerClean] },
      // ── 除螨服务 (mite_remove) ──
      41: { title: "全床深度除螨【1小时】",       subTitle: "全床深度除螨（1小时）",       price: 139, banner: images.svcMattress,      tags: _cleanTags,  spec: "1小时/次",  desc: "专业除螨仪高频振动吸取床垫螨虫，紫外线杀菌消毒。",           detailImages: [images.svcMattress, images.catMiteRemove] },
      42: { title: "居室除螨净化【2小时】",       subTitle: "居室除螨净化（2小时）",       price: 239, banner: images.svcMattress,      tags: _cleanTags,  spec: "2小时/次",  desc: "全室地毯、沙发、床垫联合除螨，空气净化处理。",               detailImages: [images.svcMattress, images.svcCarpet] },
      // ── 家具养护 (furniture_care) ──
      51: { title: "木地板翻新养护【2小时】",     subTitle: "木地板翻新养护（2小时）",     price: 299, banner: images.svcFloor,         tags: _cleanTags,  spec: "2小时/次",  desc: "实木/复合地板打磨、补色、上蜡，恢复光泽保护木质。",         detailImages: [images.svcFloor, images.catFurnitureCare] },
      52: { title: "地暖系统检测【1小时】",       subTitle: "地暖系统检测（1小时）",       price: 139, banner: images.svcFloor,         tags: _repairTags, spec: "1小时/次",  desc: "地暖各回路温度与流量检测，定位效率低下或故障区域。",         detailImages: [images.svcFloor, images.catFurnitureCare] },
      53: { title: "地暖系统清洁【2小时】",       subTitle: "地暖系统清洁（2小时）",       price: 269, banner: images.svcFloor,         tags: _cleanTags,  spec: "2小时/次",  desc: "地暖管路专业清洁，清除水垢与沉淀物，恢复供暖效率。",         detailImages: [images.svcFloor, images.catFurnitureCare] },
      54: { title: "床垫深度清洗除菌【1小时】",   subTitle: "床垫深度清洗除菌（1小时）",   price: 169, banner: images.svcMattress,      tags: _cleanTags,  spec: "1小时/次",  desc: "床垫专业喷洗除螨除菌，高温蒸汽处理，晾干后复原铺放。",       detailImages: [images.svcMattress, images.catFurnitureCare] },
      55: { title: "布艺/皮质沙发清洗【1小时】", subTitle: "布艺/皮质沙发清洗（1小时）", price: 179, banner: images.svcSofa,          tags: _cleanTags,  spec: "1小时/次",  desc: "布艺沙发深度清洁去污，皮质沙发护理上光，延长使用寿命。",     detailImages: [images.svcSofa, images.catFurnitureCare] },
      56: { title: "窗帘清洁养护【1小时】",       subTitle: "窗帘清洁养护（1小时）",       price: 129, banner: images.svcDeepClean,     tags: _cleanTags,  spec: "1小时/次",  desc: "窗帘拆洗或上门清洁，去除灰尘与污渍，复原安装。",             detailImages: [images.svcDeepClean, images.catFurnitureCare] },
      57: { title: "地毯深度清洗【1小时】",       subTitle: "地毯深度清洗（1小时）",       price: 159, banner: images.svcCarpet,        tags: _cleanTags,  spec: "1小时/次",  desc: "地毯专业喷洗除污，去异味除螨，快速晾干处理。",               detailImages: [images.svcCarpet, images.catFurnitureCare] },
      58: { title: "地板打蜡养护【1小时】",       subTitle: "地板打蜡养护（1小时）",       price: 149, banner: images.svcFloor,         tags: _cleanTags,  spec: "1小时/次",  desc: "地板清洁后专业打蜡，形成保护膜，防刮防潮延长寿命。",         detailImages: [images.svcFloor, images.catFurnitureCare] },
      59: { title: "大理石抛光养护【2小时】",     subTitle: "大理石抛光养护（2小时）",     price: 229, banner: images.svcFloor,         tags: _cleanTags,  spec: "2小时/次",  desc: "大理石台面、地面专业研磨抛光，去除划痕恢复镜面光泽。",       detailImages: [images.svcFloor, images.catFurnitureCare] },
      // ── 宝宝家事 (baby_home) ──
      61: { title: "校区接送小孩【1小时】",       subTitle: "校区接送小孩（1小时）",       price: 39,  banner: images.svcKids,          tags: _tags,       spec: "1小时/次",  desc: "专业人员按时接送孩子上下学，全程安全有保障。",               detailImages: [images.svcKids, images.catBabyHome] },
      62: { title: "课后陪读辅导【2小时】",       subTitle: "课后陪读辅导（2小时）",       price: 89,  banner: images.svcKids,          tags: _tags,       spec: "2小时/次",  desc: "专业辅导老师陪同完成作业，答疑解惑，培养学习习惯。",         detailImages: [images.svcKids, images.catBabyHome] },
      63: { title: "儿童起居照顾【2小时】",       subTitle: "儿童起居照顾（2小时）",       price: 99,  banner: images.svcBaby,          tags: _tags,       spec: "2小时/次",  desc: "专业人员负责孩子日常起居照料，含洗漱、喂饭、陪玩。",         detailImages: [images.svcBaby, images.catBabyHome] },
      64: { title: "专业育儿嫂上门【3小时】",     subTitle: "专业育儿嫂上门（3小时）",     price: 199, banner: images.svcBaby,          tags: _tags,       spec: "3小时/次",  desc: "持证育儿嫂上门服务，科学护理婴幼儿，指导家长育儿技巧。",     detailImages: [images.svcBaby, images.catBabyHome] },
      // ── 房屋修缮 (house_repair) ──
      71: { title: "岩板破损修复【1小时】",       subTitle: "岩板破损修复（1小时）",       price: 199, banner: images.svcTile,          tags: _repairTags, spec: "1小时/次",  desc: "岩板台面、墙面裂缝、崩角专业色釉修复，肉眼近乎无痕。",       detailImages: [images.svcTile, images.catHouseRepair] },
      72: { title: "瓷砖裂纹修复【1小时】",       subTitle: "瓷砖裂纹修复（1小时）",       price: 159, banner: images.svcTile,          tags: _repairTags, spec: "1小时/次",  desc: "地墙砖裂纹、崩角修复，色釉调色处理，不影响正常使用。",       detailImages: [images.svcTile, images.catHouseRepair] },
      73: { title: "局部瓷砖铺贴【2小时】",       subTitle: "局部瓷砖铺贴（2小时）",       price: 229, banner: images.svcTile,          tags: _repairTags, spec: "2小时/次",  desc: "局部瓷砖脱落或更换铺贴，含切割、上砖、勾缝处理。",           detailImages: [images.svcTile, images.catHouseRepair] },
      74: { title: "壁纸铺贴施工【2小时】",       subTitle: "壁纸铺贴施工（2小时）",       price: 239, banner: images.svcWall,          tags: _repairTags, spec: "2小时/次",  desc: "壁纸局部或整体铺贴施工，裁剪精准，接缝平整无气泡。",         detailImages: [images.svcWall, images.catHouseRepair] },
      75: { title: "厨卫漏水防水修缮【2小时】",   subTitle: "厨卫漏水防水修缮（2小时）",   price: 299, banner: images.svcWaterproof,    tags: _repairTags, spec: "2小时/次",  desc: "厨房卫生间漏水点定位，防水层修缮处理，闭水试验合格。",       detailImages: [images.svcWaterproof, images.catHouseRepair] },
      76: { title: "地板铺贴修缮【2小时】",       subTitle: "地板铺贴修缮（2小时）",       price: 279, banner: images.svcFloor,         tags: _repairTags, spec: "2小时/次",  desc: "木地板起翘、脱胶、破损局部修缮，含补色收边处理。",           detailImages: [images.svcFloor, images.catHouseRepair] },
      77: { title: "墙面刷新施工【2小时】",       subTitle: "墙面刷新施工（2小时）",       price: 259, banner: images.svcWall,          tags: _repairTags, spec: "2小时/次",  desc: "墙面旧漆清除、腻子找平后重新刷涂料，焕新墙面。",             detailImages: [images.svcWall, images.catHouseRepair] },
      78: { title: "墙面修补刷新【2小时】",       subTitle: "墙面修补刷新（2小时）",       price: 269, banner: images.svcWall,          tags: _repairTags, spec: "2小时/次",  desc: "墙面局部开裂、脱落修补，补色处理，与原墙面颜色匹配。",       detailImages: [images.svcWall, images.catHouseRepair] },
      // ── 上门美业 (beauty_home) ──
      81: { title: "上门纹绣咨询与设计【1小时】", subTitle: "上门纹绣咨询与设计（1小时）", price: 299, banner: images.svcMakeup,        tags: _beautyTags, spec: "1小时/次",  desc: "专业纹绣师上门根据面部特征设计眉形、眼线等方案，提供咨询与设计服务。", detailImages: [images.svcMakeup, images.catBeautyHome] },
      82: { title: "上门面部护理美容【1小时】",   subTitle: "上门面部护理美容（1小时）",   price: 169, banner: images.svcMakeup,        tags: _beautyTags, spec: "1小时/次",  desc: "专业美容师上门提供洁面、补水、按摩等面部基础护理服务。",     detailImages: [images.svcMakeup, images.catBeautyHome] },
      83: { title: "活动化妆造型【1小时】",       subTitle: "活动化妆造型（1小时）",       price: 199, banner: images.svcMakeup,        tags: _beautyTags, spec: "1小时/次",  desc: "专业化妆师上门提供婚礼、宴会、拍照等场合定制妆造。",         detailImages: [images.svcMakeup, images.catBeautyHome] },
      84: { title: "上门美甲基础款【1小时】",     subTitle: "上门美甲基础款（1小时）",     price: 129, banner: images.svcNail,          tags: _beautyTags, spec: "1小时/次",  desc: "专业美甲师上门提供单色、法式等基础美甲服务。",               detailImages: [images.svcNail, images.catBeautyHome] },
      85: { title: "上门美瞳搭配服务【1小时】",   subTitle: "上门美瞳搭配服务（1小时）",   price: 159, banner: images.svcMakeup,        tags: _beautyTags, spec: "1小时/次",  desc: "专业顾问根据肤色、妆容推荐美瞳颜色，提供试戴与护理指导。",   detailImages: [images.svcMakeup, images.catBeautyHome] },
      86: { title: "上门美发造型服务【1小时】",   subTitle: "上门美发造型服务（1小时）",   price: 189, banner: images.svcHair,          tags: _beautyTags, spec: "1小时/次",  desc: "专业发型师上门提供剪发、造型、吹拉等美发服务。",             detailImages: [images.svcHair, images.catBeautyHome] }
    };

    let service = null;
    try {
      const res = await util.get(`core/services/${id}`);
      if (res && typeof res === 'object') {
        const detailImages = Array.isArray(res.detail_images)
          ? res.detail_images
          : (typeof res.detail_images === 'string' ? JSON.parse(res.detail_images || '[]') : []);
        service = {
          title: res.title || res.name || "",
          subTitle: res.sub_title || res.title || res.name || "",
          price: res.price,
          banner: imgUrl(res.cover_image || res.banner || "/img/placeholders/home_cleaning.png"),
          tags: Array.isArray(res.tags) ? res.tags : ["无额外收费", "未服务随时退", "不满意重服务"],
          spec: res.spec || (res.title || res.name || ""),
          desc: res.description || res.desc || "",
          detailImages: (Array.isArray(detailImages) ? detailImages : []).map(p => imgUrl(p))
        };
      }
    } catch (e) {}

    service = service || mockMap[id] || mockMap[1];
    this.setData({
      service,
      specs: [service.spec],
      detailImages: service.detailImages,
      descText: service.desc
    });
  },
  orderConfrim() {
    const svc = this.data.service || {};
    const name = svc.title || '';
    const sub = svc.subTitle || name;
    const rawPrice = svc.price;
    let price = '0';
    if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) {
      price = String(rawPrice);
    } else if (typeof rawPrice === 'string') {
      const m = rawPrice.match(/[\d.]+/);
      price = m ? m[0] : '0';
    }
    const image = svc.banner || '';
    wx.navigateTo({
      url: `../order-confrim/order-confrim?name=${encodeURIComponent(name)}&sub=${encodeURIComponent(sub)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}`
    });
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  }
});
