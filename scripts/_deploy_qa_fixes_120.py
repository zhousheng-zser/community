"""部署 QA 修复：建表 + 后端/前端文件"""
import paramiko, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
REMOTE = '/root/community-backend/backend'
LOCAL = os.path.join(os.path.dirname(__file__), '..', 'backend')
ROOT = os.path.join(os.path.dirname(__file__), '..')

SQL = os.path.join(LOCAL, 'sql', '0434_browse_footprints_commission_balance.sql')

FILES = [
    'src/index.js',
    'src/routes/promoterRoutes.js',
    'src/modules/user/controllers/user.controller.js',
    'src/modules/commission/services/commission.service.js',
    'src/modules/promoter/controllers/promoter.controller.js',
]

MINI_FILES = [
    ('pages/community/community.js', 'pages/community/community.js'),
    ('pages/my-posts/my-posts.js', 'pages/my-posts/my-posts.js'),
    ('pages/goods-detail/goods-detail.js', 'pages/goods-detail/goods-detail.js'),
    ('pages/neighbor-assist-order-detail/neighbor-assist-order-detail.js', 'pages/neighbor-assist-order-detail/neighbor-assist-order-detail.js'),
    ('utils/snowflakeId.js', 'utils/snowflakeId.js'),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=25):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

sftp = c.open_sftp()
with open(SQL, 'r', encoding='utf-8') as f:
    sql = f.read()
remote_sql = '/tmp/0434_browse_footprints.sql'
with sftp.open(remote_sql, 'w') as rf:
    rf.write(sql)
print(run(f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db < {remote_sql}"))

for rel in FILES:
    lp = os.path.join(LOCAL, rel.replace('/', os.sep))
    rp = REMOTE + '/' + rel.replace('\\', '/')
    sftp.put(lp, rp)
    print('[OK]', rel)

# 小程序源码在 community 仓库根目录（若服务器有同步目录则上传，否则仅后端）
for rel, _ in MINI_FILES:
    lp = os.path.join(ROOT, rel.replace('/', os.sep))
    if os.path.isfile(lp):
        print('[LOCAL]', rel, '(小程序需本地编译)')

sftp.close()
run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 &')
time.sleep(4)
print('proc:', run('pgrep -af "node src/index.js" | grep src/index'))
print('footprints test:', run("curl -sk -H 'Authorization: Bearer test' http://127.0.0.1:3002/ 2>/dev/null | head -c 80"))
c.close()
print('\n[DONE] SQL + backend deployed')
