"""
修复"发给个"等新模块在小程序中不显示图标和服务的问题

步骤:
1. 检查并修复 8140 的 Categories 表缺少 group_type 列
2. 从 120 同步 gfg/ddsd 等新模块的分类(Categories)和服务(Services)到 8140
3. 从 120 复制 icon 文件到 8140
4. 验证 API 响应
"""
import sys, os, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko

S120 = {'host': '120.27.239.244', 'port': 22, 'username': 'root', 'password': 'cW123456'}
S8140 = {'host': '8.140.204.254', 'port': 22, 'username': 'root', 'password': 'edS904062'}
DB = 'community_db'
MYSQL_PW_120 = 'CommunityPwd123!'
MYSQL_PW_8140 = 'CommunityPwd123!'

def connect(cfg, retries=3):
    for i in range(retries):
        try:
            c = paramiko.SSHClient()
            c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            c.connect(cfg['host'], port=cfg['port'], username=cfg['username'],
                      password=cfg['password'], timeout=20, banner_timeout=30)
            return c
        except Exception as e:
            print(f"[connect] {cfg['host']} attempt {i+1} failed: {e}")
            if i < retries-1:
                time.sleep(3)
    raise RuntimeError(f"Cannot connect to {cfg['host']}")

def run(client, cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

def mysql_q(client, sql, db=DB, pw=None):
    if pw is None:
        pw = MYSQL_PW_8140
    # 将 SQL 写到 tmp 文件，用 MYSQL_PWD 环境变量避免 shell 特殊字符问题
    import hashlib, base64
    tmpf = f'/tmp/mq_{hashlib.md5(sql.encode()).hexdigest()[:8]}.sql'
    # 通过 stdin 写 sql 文件
    _, so, se = client.exec_command(f'cat > {tmpf}', timeout=10)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read(); se.read()
    cmd = f'MYSQL_PWD="{pw}" mysql -uroot {db} < {tmpf} 2>&1; rm -f {tmpf}'
    out, _ = run(client, cmd)
    return out

def mysql_q_120(client, sql, db=DB):
    return mysql_q(client, sql, db=db, pw=MYSQL_PW_120)

def mysql_q_8140(client, sql, db=DB):
    return mysql_q(client, sql, db=db, pw=MYSQL_PW_8140)

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# ─── STEP 1: 检查/修复 8140 的 Categories 表 ─────────────────────
section("STEP 1: 检查 8140 Categories 表结构")
c8140 = connect(S8140)

# 检查 group_type 列
out = mysql_q_8140(c8140, "SHOW COLUMNS FROM Categories LIKE 'group_type';")
print(f"group_type 列: {out}")

if 'group_type' not in out:
    print("[FIX] 添加 group_type 列到 Categories...")
    r = mysql_q_8140(c8140, "ALTER TABLE Categories ADD COLUMN group_type VARCHAR(100) NULL AFTER icon_url;")
    print(f"ALTER 结果: {r}")
else:
    print("[OK] group_type 列已存在")

# 确认 createdAt/updatedAt 也在
out2 = mysql_q_8140(c8140, "SHOW COLUMNS FROM Categories;")
print(f"Categories 列:\n{out2}")

# ─── STEP 2: 从 120 查询 gfg/ddsd 分类和服务 ──────────────────────
section("STEP 2: 从 120 获取 gfg/ddsd 分类数据")
c120 = connect(S120)

# 获取所有非默认 group_type 的分类 (排除空和已有的9大分类)
DEFAULT_KEYS = "('tidy','urgent_fix','appliance_clean','pioneer_clean','mite_remove','furniture_care','baby_home','house_repair','beauty_home')"
cats_out = mysql_q_120(c120,
    "SELECT id, name, icon_url, sort_order, group_type, createdAt, updatedAt FROM Categories "
    f"WHERE group_type IS NOT NULL AND group_type NOT IN {DEFAULT_KEYS} "
    "ORDER BY id;")
print(f"120 新分类:\n{cats_out}")

# 解析分类数据
cats_json_out, _ = run(c120,
    f'''mysql -uroot -p{MYSQL_PW_120} {DB} -e "SELECT id, name, icon_url, sort_order, group_type FROM Categories WHERE group_type IS NOT NULL AND group_type NOT IN {DEFAULT_KEYS};" 2>/dev/null | python3 -c "
import sys, json
lines = [l.rstrip() for l in sys.stdin if l.strip()]
if len(lines) < 2:
    print('[]'); sys.exit()
headers = lines[0].split(chr(9))
rows = []
for line in lines[1:]:
    vals = line.split(chr(9))
    rows.append(dict(zip(headers, vals)))
print(json.dumps(rows, ensure_ascii=False))
" ''')
print(f"JSON: {cats_json_out}")
try:
    cats = json.loads(cats_json_out) if cats_json_out else []
except:
    cats = []
print(f"解析到 {len(cats)} 个分类")

# ─── STEP 3: 同步分类到 8140 ──────────────────────────────────────
section("STEP 3: 同步分类到 8140")

for cat in cats:
    name = cat.get('name', '').replace("'", "''")
    icon_url = cat.get('icon_url') or ''
    icon_url = icon_url.replace("'", "''")
    sort_order = cat.get('sort_order') or 0
    group_type = cat.get('group_type', '').replace("'", "''")
    now = 'NOW()'

    # 检查是否已存在
    check = mysql_q_8140(c8140, f"SELECT id FROM Categories WHERE group_type='{group_type}' AND name='{name}' LIMIT 1;")
    if check and check.strip() and check.strip() != 'id' and any(ch.isdigit() for ch in check):
        # 更新
        r = mysql_q_8140(c8140,
            f"UPDATE Categories SET icon_url='{icon_url}', sort_order={sort_order}, updatedAt={now} "
            f"WHERE group_type='{group_type}' AND name='{name}';")
        print(f"[UPDATE] {group_type}/{name}: {r or 'ok'}")
    else:
        # 插入
        r = mysql_q_8140(c8140,
            f"INSERT INTO Categories (name, icon_url, sort_order, group_type, createdAt, updatedAt) "
            f"VALUES ('{name}', '{icon_url}', {sort_order}, '{group_type}', {now}, {now});")
        print(f"[INSERT] {group_type}/{name}: {r or 'ok'}")

# 验证
verify = mysql_q_8140(c8140,
    f"SELECT id, name, group_type, icon_url FROM Categories WHERE group_type NOT IN {DEFAULT_KEYS} AND group_type IS NOT NULL;")
print(f"\n8140 新分类验证:\n{verify}")

# ─── STEP 4: 从 120 获取 gfg/ddsd 服务并同步到 8140 ─────────────
section("STEP 4: 同步服务(Services)到 8140")

# 获取分类 ID 映射 (120)
cat_ids_120_out = mysql_q_120(c120,
    f"SELECT id, group_type FROM Categories WHERE group_type NOT IN {DEFAULT_KEYS} AND group_type IS NOT NULL;")
print(f"120 新分类 IDs:\n{cat_ids_120_out}")

# 获取这些分类下的所有服务
svcs_json_out, _ = run(c120,
    f'''mysql -uroot -p{MYSQL_PW_120} {DB} -e "SELECT s.id, s.title, s.description, s.price, s.cover_image, s.sales_count, s.is_published, s.sub_title, c.group_type, c.name as cat_name FROM Services s JOIN Categories c ON s.category_id = c.id WHERE c.group_type NOT IN {DEFAULT_KEYS} AND c.group_type IS NOT NULL ORDER BY s.id;" 2>/dev/null | python3 -c "
import sys, json
lines = [l.rstrip() for l in sys.stdin if l.strip()]
if len(lines) < 2:
    print(chr(91)+chr(93)); sys.exit()
headers = lines[0].split(chr(9))
rows = []
for line in lines[1:]:
    vals = line.split(chr(9))
    rows.append(dict(zip(headers, vals)))
print(json.dumps(rows, ensure_ascii=False))
" ''')
print(f"120 新服务 JSON 预览: {svcs_json_out[:500]}")
try:
    svcs = json.loads(svcs_json_out) if svcs_json_out else []
except Exception as e:
    print(f"JSON 解析失败: {e}")
    svcs = []
print(f"解析到 {len(svcs)} 个服务")

# 同步服务到 8140 - 先获取 8140 上对应分类 ID
for svc in svcs:
    group_type = svc.get('group_type', '')
    cat_name = svc.get('cat_name', '').replace("'", "''")
    # 在 8140 找到对应的 category_id
    cat_row = mysql_q_8140(c8140,
        f"SELECT id FROM Categories WHERE group_type='{group_type}' AND name='{cat_name}' LIMIT 1;")
    # 提取 id
    cat_id_8140 = None
    for line in cat_row.split('\n'):
        line = line.strip()
        if line.isdigit():
            cat_id_8140 = int(line)
            break
    if not cat_id_8140:
        print(f"[SKIP] 找不到 8140 分类 {group_type}/{cat_name}")
        continue

    title = svc.get('title', '').replace("'", "''")
    price = svc.get('price', '0') or '0'
    cover = (svc.get('cover_image') or '').replace("'", "''")
    sales = svc.get('sales_count', '0') or '0'
    published = svc.get('is_published', '1') or '1'
    sub_title = (svc.get('sub_title') or '').replace("'", "''")
    description = (svc.get('description') or '').replace("'", "''").replace('\n', ' ')[:500]

    # 检查是否已存在
    check_svc = mysql_q_8140(c8140,
        f"SELECT id FROM Services WHERE title='{title}' AND category_id={cat_id_8140} LIMIT 1;")
    if check_svc and check_svc.strip() and check_svc.strip() != 'id' and any(ch.isdigit() for ch in check_svc):
        print(f"[SKIP-EXISTS] {group_type}/{title}")
        continue

    r = mysql_q_8140(c8140,
        f"INSERT INTO Services (category_id, title, description, price, cover_image, sales_count, is_published, sub_title, createdAt, updatedAt) "
        f"VALUES ({cat_id_8140}, '{title}', '{description}', {price}, '{cover}', {sales}, {published}, '{sub_title}', NOW(), NOW());")
    print(f"[INSERT-SVC] {group_type}/{title}: {r or 'ok'}")

# 验证
verify_svc = mysql_q_8140(c8140,
    f"SELECT s.id, s.title, c.group_type FROM Services s JOIN Categories c ON s.category_id=c.id WHERE c.group_type NOT IN {DEFAULT_KEYS} AND c.group_type IS NOT NULL ORDER BY s.id;")
print(f"\n8140 新服务验证:\n{verify_svc}")

# ─── STEP 5: 复制 icon 文件从 120 到 8140 ─────────────────────────
section("STEP 5: 复制 icon 文件")

# 获取 8140 service_home_modules 中的 icon_url
icons_out = mysql_q_8140(c8140,
    "SELECT group_key, icon_url FROM service_home_modules WHERE icon_url IS NOT NULL AND icon_url LIKE '/uploads/%';")
print(f"需要复制的 icon:\n{icons_out}")

if icons_out and '/uploads/' in icons_out:
    # 解析 icon 路径
    icon_paths = []
    for line in icons_out.split('\n'):
        if '/uploads/' in line:
            parts = line.split('\t')
            if len(parts) >= 2:
                icon_paths.append(parts[1].strip())

    print(f"解析到 {len(icon_paths)} 个图标路径: {icon_paths}")

    # 检查 8140 上的 uploads 目录
    up_dir_8140 = '/root/community-backend/backend/data/uploads'
    r, _ = run(c8140, f'ls {up_dir_8140} 2>&1 | head -5')
    print(f"8140 uploads目录: {r}")

    # 从 120 下载图标文件，然后上传到 8140
    sftp_120 = c120.open_sftp()
    sftp_8140 = c8140.open_sftp()
    up_dir_120 = '/root/community-backend/backend/data/uploads'

    # 确保 8140 目录存在
    run(c8140, f'mkdir -p {up_dir_8140}')

    for icon_path in icon_paths:
        # icon_path like /uploads/file-xxx.jpg
        filename = os.path.basename(icon_path)
        src_120 = f'{up_dir_120}/{filename}'
        dst_8140 = f'{up_dir_8140}/{filename}'

        try:
            # 检查 8140 上是否已存在
            r, _ = run(c8140, f'ls {dst_8140} 2>&1')
            if 'No such file' not in r and filename in r:
                print(f"[SKIP-EXISTS] {filename} 已在 8140")
                continue

            # 从 120 下载到内存
            import io
            buf = io.BytesIO()
            sftp_120.getfo(src_120, buf)
            buf.seek(0)
            # 上传到 8140
            sftp_8140.putfo(buf, dst_8140)
            print(f"[COPIED] {filename} from 120 to 8140")
        except Exception as e:
            print(f"[ERROR] 复制 {filename}: {e}")

    sftp_120.close()
    sftp_8140.close()
else:
    print("[INFO] 没有需要复制的 /uploads/ 格式图标，或暂时无法解析")

# ─── STEP 6: 验证 API ──────────────────────────────────────────────
section("STEP 6: 验证 8140 API")

# 重启 8140 backend (以便 Sequelize 重新读取最新 schema)
print("重启 8140 后端...")
r, e = run(c8140, 'cd /root/community-backend && pm2 restart all 2>&1 | tail -5', timeout=30)
print(f"PM2 restart: {r}")
time.sleep(5)

# 测试 service-groups/gfg
r, _ = run(c8140, 'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg 2>&1 | head -c 500')
print(f"\nservice-groups/gfg: {r}")

r2, _ = run(c8140, 'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/tidy 2>&1 | head -c 300')
print(f"\nservice-groups/tidy: {r2}")

r3, _ = run(c8140, 'curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules 2>&1 | head -c 400')
print(f"\nservice-home-modules: {r3}")

c120.close()
c8140.close()
print("\n[DONE] 脚本执行完成")
