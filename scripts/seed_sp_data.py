#!/usr/bin/env python3
"""
直约服务商初始化种子数据脚本
- 更新现有 service_provider_profiles，添加真实店铺名、图片
- 清除占位服务数据，插入真实分类服务数据
"""
import subprocess
import sys

DB_USER = "root"
DB_PASS = "CommunityPwd123!"
DB_NAME = "community_db"

def run_sql(sql):
    result = subprocess.run(
        ["mysql", f"-u{DB_USER}", f"-p{DB_PASS}", DB_NAME, "-e", sql],
        capture_output=True, text=True
    )
    if result.returncode != 0 and result.stderr:
        stderr = result.stderr.replace("mysql: [Warning] Using a password on the command line interface can be insecure.\n", "")
        if stderr.strip():
            print(f"[WARN] {stderr.strip()[:300]}")
    return result.stdout

# ── 1. 查看现有 profile ──────────────────────────────────────
print("=== 现有 service_provider_profiles ===")
print(run_sql("SELECT id, user_id, shop_name, status FROM service_provider_profiles ORDER BY id LIMIT 5"))

# ── 2. 更新前 5 个 profile 为真实数据 ───────────────────────
print("=== 更新服务商门店信息 ===")

sp_data = [
    # (id, shop_name, contact_name, phone, shop_front_url, license_url)
    (1, "晶洁家政服务中心", "王晶",   "13812340001",
     "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70",
     "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70"),
    (2, "安之家维修工坊",   "陈安",   "13812340002",
     "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=70",
     "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70"),
    (3, "绿居环境整洁服务", "李绿",   "13812340003",
     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70",
     "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70"),
    (4, "快速搬运物流站",   "赵快",   "13812340004",
     "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=70",
     "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70"),
    (5, "悦美装饰设计室",   "刘悦",   "13812340005",
     "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=70",
     "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=70"),
]

for sp_id, shop_name, contact_name, phone, shop_front, license_url in sp_data:
    env_json = '["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=70","https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70"]'
    sql = (
        f"UPDATE service_provider_profiles SET "
        f"shop_name='{shop_name}', contact_name='{contact_name}', phone='{phone}', "
        f"shop_front_url='{shop_front}', license_url='{license_url}', "
        f"environment_url='{env_json}' "
        f"WHERE id={sp_id}"
    )
    run_sql(sql)
    print(f"  Updated profile id={sp_id} -> {shop_name}")

# ── 3. 删除 provider_id=NULL 的占位服务 ─────────────────────
print("\n=== 清除 provider_id=NULL 的占位服务 ===")
print(run_sql("SELECT COUNT(*) as before_delete FROM Services WHERE provider_id IS NULL"))
run_sql("DELETE FROM Services WHERE provider_id IS NULL")
print(run_sql("SELECT COUNT(*) as after_delete FROM Services"))

# ── 4. 查找 category_id（服务相关分类）───────────────────────
cat_out = run_sql("SELECT id, name FROM categories LIMIT 20")
if "ERROR" in cat_out or not cat_out.strip():
    # 没有 categories 表，插入时 category_id 用 NULL
    cat_cleaning = "NULL"
    cat_repair    = "NULL"
    cat_move      = "NULL"
    cat_design    = "NULL"
    cat_other     = "NULL"
    print("[INFO] categories 表不可用，category_id 将设为 NULL")
else:
    print("=== 现有分类 ===")
    print(cat_out)
    # 简单取前几个 id
    lines = [l for l in cat_out.strip().split("\n") if l and l[0].isdigit()]
    ids = [int(l.split("\t")[0]) for l in lines]
    cat_cleaning = ids[0] if len(ids) > 0 else "NULL"
    cat_repair    = ids[1] if len(ids) > 1 else "NULL"
    cat_move      = ids[2] if len(ids) > 2 else "NULL"
    cat_design    = ids[3] if len(ids) > 3 else "NULL"
    cat_other     = ids[4] if len(ids) > 4 else "NULL"

# ── 5. 插入真实服务数据 ──────────────────────────────────────
print("\n=== 插入真实服务数据 ===")

services = [
    # provider_id=1  晶洁家政
    (1, cat_cleaning, "深度保洁·全屋焕新", "专业团队上门，去除顽固污渍、全屋消毒",
     "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=70",
     "深度清洁套餐", 298),
    (1, cat_cleaning, "开荒保洁·新房入住", "新装修清洁，甲醛净化，专业验收",
     "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=70",
     "含耗材与工具", 388),
    (1, cat_cleaning, "定期保洁·月度套餐", "每月 4 次上门，保持居家整洁",
     "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=70",
     "4次/月", 599),
    (1, cat_cleaning, "家电清洗·洗衣机槽", "内桶深度清洁，拆卸清洗，去霉菌",
     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70",
     "含消毒液", 129),

    # provider_id=2  安之家维修
    (2, cat_repair, "水电维修·漏水处理", "水管破裂、阀门维修，一小时响应",
     "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=70",
     "免上门费", 168),
    (2, cat_repair, "家电安装·空调挂机", "挂机安装含打孔，送铜管延长",
     "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70",
     "1.5P以下", 198),
    (2, cat_repair, "锁具更换·防盗门锁", "C级锁芯更换，品牌正品",
     "https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&fit=crop&w=600&q=70",
     "送新锁芯", 148),
    (2, cat_repair, "家具组装·宜家代装", "专业测量、精准安装，全品牌通用",
     "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=70",
     "含辅料", 88),

    # provider_id=3  绿居环境
    (3, cat_cleaning, "空气净化·甲醛检测", "专业仪器检测+催化净化，附检测报告",
     "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70",
     "含检测报告", 399),
    (3, cat_cleaning, "消杀除虫·全屋灭蟑", "德国进口药剂，灭蟑螂/蚂蚱/跳蚤",
     "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=70",
     "90天质保", 268),
    (3, cat_cleaning, "地板打蜡·木地板养护", "深度清洁+蜡层修护，恢复光泽",
     "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=70",
     "100㎡以内", 358),

    # provider_id=4  快速搬运
    (4, cat_move, "同城搬家·小件快搬", "面包车搬运，2人服务，2小时内完成",
     "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=70",
     "5公里以内", 199),
    (4, cat_move, "整屋搬迁·大件搬运", "4吨货车+3名专业搬运工",
     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70",
     "含楼层费", 599),
    (4, cat_move, "钢琴搬运·专业设备", "专用滑板车，保险保障，全程拍照",
     "https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&fit=crop&w=600&q=70",
     "含调音服务", 299),

    # provider_id=5  悦美装饰
    (5, cat_design, "软装搭配·色彩顾问", "专业软装师上门测量，出方案",
     "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=70",
     "含3套方案", 499),
    (5, cat_design, "旧房翻新·墙面粉刷", "腻子+乳胶漆，净味环保，遮盖力强",
     "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=70",
     "50㎡起", 2800),
    (5, cat_design, "灯具安装·全屋改造", "拆旧+安装，含吊顶筒灯、吊灯",
     "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=70",
     "按套计价", 388),
]

now = "NOW()"
inserted = 0
for svc in services:
    pid, cat_id, title, desc, cover, sub_title, price = svc
    cat_val = cat_id if cat_id != "NULL" else "NULL"
    sql = (
        f"INSERT INTO Services (category_id, title, description, price, cover_image, "
        f"sub_title, is_published, provider_id, sales_count, order_count, createdAt, updatedAt) "
        f"VALUES ({cat_val}, '{title}', '{desc}', {price}, '{cover}', "
        f"'{sub_title}', 1, {pid}, {price // 10}, 0, {now}, {now})"
    )
    run_sql(sql)
    inserted += 1

print(f"  插入 {inserted} 条服务记录")
print(run_sql("SELECT COUNT(*) as total_services FROM Services"))

# ── 6. 验证结果 ──────────────────────────────────────────────
print("\n=== 最终服务数据（前8条）===")
print(run_sql("SELECT id, provider_id, title, price, is_published FROM Services ORDER BY id LIMIT 8"))

print("\n=== 直约服务商 API 模拟（active 状态门店）===")
print(run_sql("SELECT id, shop_name, shop_front_url FROM service_provider_profiles WHERE status='active' LIMIT 5"))

print("\n✅ 种子数据插入完成！")
