#!/usr/bin/env python3
"""
直约服务商全量种子数据脚本
- 给 community_id=1 ("合川路(地铁站)") 绑定5家真实服务商门店
- 更新 E2E 测试门店为有意义的名称和图片
- 每家门店配 3~4 个上架服务
"""
import subprocess

def sql(q):
    r = subprocess.run(
        ['mysql', '-uroot', '-pCommunityPwd123!', 'community_db', '-e', q],
        capture_output=True, text=True
    )
    stderr = r.stderr.replace("mysql: [Warning] Using a password on the command line interface can be insecure.\n", "").strip()
    if stderr:
        print(f"  [WARN] {stderr[:200]}")
    return r.stdout

COMMUNITY_ID = 1  # 合川路(地铁站)

# ── Unsplash 封面图池（家政/维修/装修/搬运/清洁/设计）────────────────────
COVERS = {
    'clean1':  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=70',
    'clean2':  'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=70',
    'clean3':  'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=70',
    'repair1': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=70',
    'repair2': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70',
    'repair3': 'https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&fit=crop&w=600&q=70',
    'move1':   'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=70',
    'design1': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=70',
    'design2': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=70',
    'pest1':   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70',
    'ac1':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70',
    'floor1':  'https://images.unsplash.com/photo-1562664377-709f2c337eb2?auto=format&fit=crop&w=600&q=70',
    'wash1':   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70',
    'gate1':   'https://images.unsplash.com/photo-1575377222312-dd1a63a51638?auto=format&fit=crop&w=600&q=70',
    'paint1':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70',
}

SHOP_FRONTS = [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&fit=crop&w=400&q=70',
]

ENV_JSON = '["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=70","https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70"]'
LICENSE_URL = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70'

# ─────────────────────────────────────────────────────────────────────────────
# 1. 修复已有 5 家真实门店：设 community_id=1
# ─────────────────────────────────────────────────────────────────────────────
print("=== Step1: 将 id=1~5 门店绑定到 community_id=1 ===")
sql(f"UPDATE service_provider_profiles SET community_id={COMMUNITY_ID} WHERE id IN (1,2,3,4,5)")
print(sql("SELECT id,shop_name,community_id FROM service_provider_profiles WHERE id<=5"))

# ─────────────────────────────────────────────────────────────────────────────
# 2. 重命名 E2E 门店（id=6~10，保留其 community_id=1）
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Step2: 重命名 E2E 测试门店为有意义的名称 ===")
e2e_shops = [
    (6,  "合川家电清洗服务站", "张明", "13655560001", SHOP_FRONTS[5]),
    (7,  "小区管家保洁中心",   "李丽", "13655560002", SHOP_FRONTS[6]),
    (8,  "闪修达人维修工坊",   "王强", "13655560003", SHOP_FRONTS[7]),
    (9,  "邻里搬家服务队",     "陈华", "13655560004", SHOP_FRONTS[0]),
    (10, "全能家居改造店",     "刘芳", "13655560005", SHOP_FRONTS[1]),
]
for pid, shop_name, contact, phone, front in e2e_shops:
    sql(
        f"UPDATE service_provider_profiles SET shop_name='{shop_name}', "
        f"contact_name='{contact}', phone='{phone}', shop_front_url='{front}', "
        f"license_url='{LICENSE_URL}', environment_url='{ENV_JSON}' "
        f"WHERE id={pid}"
    )
    print(f"  Updated id={pid} -> {shop_name}")

# 隐藏 id=11~21 的多余 E2E 门店（设为 inactive）
sql("UPDATE service_provider_profiles SET status='inactive' WHERE id>10")
print(sql("SELECT COUNT(*) as active_cnt FROM service_provider_profiles WHERE status='active'"))

# ─────────────────────────────────────────────────────────────────────────────
# 3. 为 E2E 门店插入真实服务（先隐藏其旧 E2E 服务）
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Step3: 隐藏 E2E 测试服务 ===")
sql("UPDATE Services SET is_published=0 WHERE provider_id IN (6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21) AND title LIKE '%E2E%'")

print("\n=== Step4: 为重命名的 5 家门店插入真实服务 ===")

# 格式: (profile_id, title, desc, cover, sub_title, price, sales_count)
new_services = [
    # id=6  合川家电清洗服务站
    (6, '空调深度清洗·挂机型', '专业拆洗，去霉菌，恢复制冷效率', COVERS['ac1'],   '含清洗剂', 129, 82),
    (6, '洗衣机槽清洁·内桶杀菌', '内桶深度清洁，拆卸人工去污', COVERS['wash1'],  '送除菌液', 99,  56),
    (6, '油烟机清洗·全拆解', '烟机全拆解深度清洁，含过滤网浸泡', COVERS['clean1'],'进口清洗剂', 168, 73),
    (6, '燃气灶清洗·铸铁炉头', '炉头去油污，点火针疏通，恢复火力', COVERS['repair1'], '含零配件', 89, 34),

    # id=7  小区管家保洁中心
    (7, '日常保洁·3小时套餐', '厨卫、客厅、卧室全方位打扫', COVERS['clean2'], '含清洁剂', 168, 120),
    (7, '开荒保洁·新房交付', '新装修全屋开荒，去除施工遗留污渍', COVERS['clean3'], '含工具耗材', 398, 65),
    (7, '地板清洁·木地板护理', '专业木地板清洁+打蜡护理', COVERS['floor1'], '100㎡以内', 288, 48),
    (7, '消杀除虫·蟑螂蚂蚁', '德国进口药剂，90天效果质保', COVERS['pest1'], '全屋喷洒', 258, 37),

    # id=8  闪修达人维修工坊
    (8, '水管漏水维修·紧急响应', '水管破裂、接头漏水，1小时响应', COVERS['repair1'], '免上门费', 198, 95),
    (8, '电路维修·断电排查', '查找短路断路，安装插座开关', COVERS['repair2'], '安全施工', 148, 71),
    (8, '马桶疏通·不通包退', '专业机械疏通，当场见效', COVERS['repair3'], '保修7天', 99,  86),
    (8, '门锁安装·C级防盗锁', '提供C级锁芯更换安装服务', COVERS['gate1'], '送锁芯', 138, 43),

    # id=9  邻里搬家服务队
    (9, '小件搬运·面包车快搬', '2人服务，面包车运输，5公里以内', COVERS['move1'], '含搬运工人', 199, 110),
    (9, '整屋搬迁·4吨货车', '3名专业搬运工+4吨车，含上下楼费', COVERS['clean1'], '按楼层计费', 599, 58),
    (9, '打包服务·专业装箱', '专业打包团队，气泡膜全保护', COVERS['clean2'], '含打包材料', 188, 29),

    # id=10 全能家居改造店
    (10, '墙面粉刷·乳胶漆净味', '腻子+净味乳胶漆，2遍面漆', COVERS['paint1'], '50㎡起', 2800, 22),
    (10, '灯具安装·吊灯/筒灯', '拆旧+安装，含吊顶筒灯改造', COVERS['design1'], '按套计价', 388, 34),
    (10, '软装顾问·色彩搭配', '专业软装师上门，出3套方案', COVERS['design2'], '含效果图', 499, 17),
    (10, '壁纸铺贴·全屋施工', '欧式/日式/简约，多种风格可选', COVERS['floor1'], '含辅料', 1800, 28),
]

inserted = 0
for svc in new_services:
    pid, title, desc, cover, sub, price, sales = svc
    q = (
        f"INSERT INTO Services (title, description, price, cover_image, sub_title, "
        f"is_published, provider_id, sales_count, order_count, createdAt, updatedAt) "
        f"VALUES ('{title}', '{desc}', {price}, '{cover}', '{sub}', "
        f"1, {pid}, {sales}, 0, NOW(), NOW())"
    )
    sql(q)
    inserted += 1

print(f"  插入 {inserted} 条服务")

# ─────────────────────────────────────────────────────────────────────────────
# 4. 验证
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 验证：community_id=1 的活跃门店 ===")
print(sql(f"SELECT id,shop_name,shop_front_url FROM service_provider_profiles WHERE community_id={COMMUNITY_ID} AND status='active' ORDER BY id"))

print("\n=== 验证：各门店服务数量 ===")
print(sql("SELECT p.shop_name, COUNT(s.id) as svc_count FROM service_provider_profiles p LEFT JOIN Services s ON s.provider_id=p.id AND s.is_published=1 WHERE p.status='active' GROUP BY p.id,p.shop_name"))

print("\n✅ 全量种子数据完成！")
