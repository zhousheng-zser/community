"""部署社区模块修复到 120：profile/steward/posts/geo + 小程序页面"""
import os
import sys
import time
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE_BACKEND = '/root/community-backend/backend'

BACKEND_FILES = [
    'backend/src/controllers/userController.js',
    'backend/src/controllers/postController.js',
    'backend/src/routes/userRoutes.js',
    'backend/src/routes/geoRoutes.js',
    'backend/src/routes/coreDataRoutes.js',
    'backend/src/controllers/communityListController.js',
    'backend/src/modules/steward/routes.js',
    'backend/src/modules/steward/controllers/steward.controller.js',
    'backend/src/models/post.js',
    'backend/src/models/comment.js',
    'backend/src/models/like.js',
    'backend/src/utils/resolveUserId.js',
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=25, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()


def rel_backend(p):
    return p.split('backend/', 1)[1]


for rel in BACKEND_FILES:
    local = os.path.join(LOCAL, rel.replace('/', os.sep))
    remote = f'{REMOTE_BACKEND}/{rel_backend(rel)}'
    sftp.put(local, remote)
    print(f'[backend] {rel}')

sftp.close()


def run(cmd, t=20):
    _, o, e = c.exec_command(cmd, timeout=t)
    out = o.read().decode('utf-8', 'replace').strip()
    err = e.read().decode('utf-8', 'replace').strip()
    return out + ('\n' + err if err else '')


# SQL：小区种子 + 管家档案
sql_path = os.path.join(LOCAL, 'backend', 'sql', '0431_community_seed_and_fix.sql')
if os.path.isfile(sql_path):
    sql = open(sql_path, encoding='utf-8').read()
    _, so, _ = c.exec_command('cat > /tmp/0431_community.sql', timeout=5)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read()
    print('[sql]', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db < /tmp/0431_community.sql 2>&1')[:200])


run('pkill -9 -f "node src/index.js" || true')
time.sleep(2)
c.exec_command(f'setsid bash -c "cd {REMOTE_BACKEND} && node src/index.js >> nohup.out 2>&1" &')
time.sleep(5)

print('\n=== 验证 ===')
# profile steward_status
cmd = r'''TOKEN=$(curl -s -X POST http://127.0.0.1:3002/api/v1/auth/login_sms -H "Content-Type: application/json" -d '{"phone":"15267619061","code":"024680"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s http://127.0.0.1:3002/api/v1/user/profile -H "Authorization: Bearer $TOKEN"'''
print('profile:', run(cmd)[:600])

print('geo:', run('curl -s http://127.0.0.1:3002/api/v1/geo/communities | head -c 180'))
print('posts:', run('curl -s "http://127.0.0.1:3002/api/v1/posts?category=%E7%83%AD%E9%97%A8%E8%AF%9D%E9%A2%98&limit=1" | head -c 200'))
print('steward public:', run('curl -s "http://127.0.0.1:3002/api/v1/steward/public/info?community_id=1" | head -c 200'))

# PATCH community_id
patch_cmd = r'''TOKEN=$(curl -s -X POST http://127.0.0.1:3002/api/v1/auth/login_sms -H "Content-Type: application/json" -d '{"phone":"15267619061","code":"024680"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s -X PATCH http://127.0.0.1:3002/api/v1/user/profile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"community_id":1}' '''
print('patch profile:', run(patch_cmd)[:300])

c.close()
print('\n[DONE] 后端已部署并重启')
