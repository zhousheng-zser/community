"""对比首页九宫格 API 与数据库 icon 配置"""
import paramiko, json, ssl, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
PW = 'CommunityPwd123!'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=20):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

sql = (
    "SELECT group_key, title, icon_url, sort_order, is_active "
    "FROM service_home_modules ORDER BY sort_order, id;"
)
db_out = run(f"MYSQL_PWD='{PW}' mysql -uroot community_db -e \"{sql}\"")
print('=== DB service_home_modules ===')
print(db_out)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
r = urllib.request.urlopen(
    urllib.request.Request('https://120.27.239.244:3001/api/v1/core/service-home-modules'),
    context=ctx, timeout=15
)
api = json.loads(r.read().decode())
print('\n=== API /core/service-home-modules ===')
for row in (api.get('data') or api)[:8]:
    print(json.dumps(row, ensure_ascii=False))

# 检查 uploads 文件是否存在
print('\n=== uploads 文件检查 ===')
for line in db_out.split('\n')[1:]:
    if not line.strip() or '\t' not in line:
        continue
    parts = line.split('\t')
    if len(parts) < 4:
        continue
    gk, title, icon = parts[0], parts[1], parts[2]
    if icon and icon != 'NULL' and icon.startswith('/uploads/'):
        fn = icon.split('/')[-1]
        exists = run(f'test -f /root/community-backend/backend/data/uploads/{fn} && echo YES || echo NO')
        print(f'{title} ({gk}): {icon} -> file {exists}')
    elif icon == 'NULL' or not icon:
        print(f'{title} ({gk}): icon_url 为空 -> 小程序会用本地兜底图')

c.close()
