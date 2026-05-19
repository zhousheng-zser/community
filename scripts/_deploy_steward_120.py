"""部署小区管家模块到 120：后端路由 + 中台页面"""
import os, sys, time, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE_BACKEND = '/root/community-backend/backend'
REMOTE_ADMIN = '/root/community-backend/admin'

BACKEND_FILES = [
    'backend/src/index.js',
    'backend/src/modules/steward/routes.js',
    'backend/src/modules/steward/controllers/steward.controller.js',
    'backend/src/modules/steward/models/CommunityStewardApplication.js',
    'backend/src/modules/steward/models/CommunityStewardProfile.js',
]

ADMIN_FILES = [
    'admin/src/views/StewardApplications.vue',
    'admin/src/router/index.js',
    'admin/src/layout/index.vue',
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=25, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

def rel_backend(p):
    return p.split('backend/', 1)[1]

def rel_admin(p):
    return p.split('admin/', 1)[1]

for rel in BACKEND_FILES:
    local = os.path.join(LOCAL, rel.replace('/', os.sep))
    remote = f'{REMOTE_BACKEND}/{rel_backend(rel)}'
    sftp.put(local, remote)
    print(f'[backend] {rel}')

for rel in ADMIN_FILES:
    local = os.path.join(LOCAL, rel.replace('/', os.sep))
    remote = f'{REMOTE_ADMIN}/{rel_admin(rel)}'
    sftp.put(local, remote)
    print(f'[admin] {rel}')

sftp.close()

def run(cmd, t=20):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# 确保表存在
sql = open(os.path.join(LOCAL, 'backend', 'sql', '0430_community_steward.sql'), encoding='utf-8').read()
_, so, _ = c.exec_command('cat > /tmp/0430_steward.sql', timeout=5)
so.channel.send(sql.encode('utf-8'))
so.channel.shutdown_write()
so.read()
run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db < /tmp/0430_steward.sql 2>&1')

# 重启 backend
run('pkill -9 -f "node src/index.js" || true')
time.sleep(2)
c.exec_command(f'setsid bash -c "cd {REMOTE_BACKEND} && node src/index.js >> nohup.out 2>&1" &')
time.sleep(5)

# 验证 API
print('\n=== API ===')
print('steward route:', run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/v1/steward/applications'))
print('grep index:', run(f'grep steward {REMOTE_BACKEND}/src/index.js'))

# admin 热更新（vite 会自动 reload，若无则重启）
print('\n=== Admin ===')
print('vue file:', run(f'ls {REMOTE_ADMIN}/src/views/StewardApplications.vue'))
print('router:', run(f'grep steward {REMOTE_ADMIN}/src/router/index.js'))
vite_pid = run('pgrep -f "vite --host" | head -1')
if vite_pid:
    print('vite running pid:', vite_pid)
else:
    c.exec_command(f'setsid bash -c "cd {REMOTE_ADMIN} && npm run dev -- --host 0.0.0.0 --port 5173 >> /tmp/admin_vite.log 2>&1" &')
    print('started admin vite')

c.close()
print('\n[DONE] http://120.27.239.244:5173/steward-applications')
