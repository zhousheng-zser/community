import paramiko, sys, os, time

LOCAL_ROOT = r'D:\CODE\project\community'
REMOTE_ROOT = '/root/community-backend/backend'

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)
sftp = s.open_sftp()

def run(cmd):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=15)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    sys.stdout.buffer.write(('>>> ' + cmd[:120] + '\n' + out + err + '\n').encode('utf-8', 'replace'))
    sys.stdout.buffer.flush()
    return out + err

def upload(local_rel, remote_rel=None):
    if remote_rel is None:
        remote_rel = local_rel
    local_path = os.path.join(LOCAL_ROOT, local_rel)
    remote_path = REMOTE_ROOT + '/' + remote_rel
    remote_dir = '/'.join(remote_path.split('/')[:-1])
    try:
        sftp.stat(remote_dir)
    except:
        run(f'mkdir -p {remote_dir}')
    sftp.put(local_path, remote_path)
    print(f'OK: {remote_rel}')

# 1. Create service_favorites table
create_sql = """CREATE TABLE IF NOT EXISTS service_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  title VARCHAR(200) DEFAULT '',
  cover VARCHAR(500) DEFAULT '',
  price VARCHAR(32) DEFAULT '',
  url VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_kind_target (user_id, kind, target_id),
  INDEX idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"""

with sftp.file('/tmp/create_svc_fav.sql', 'w') as f:
    f.write(create_sql)

run("mysql -uroot -p'CommunityPwd123!' community_db < /tmp/create_svc_fav.sql 2>&1")

# 2. Upload files
upload('backend/src/modules/user/models/ServiceFavorite.js', 'src/modules/user/models/ServiceFavorite.js')
upload('backend/src/modules/user/controllers/user.controller.js', 'src/modules/user/controllers/user.controller.js')
upload('backend/src/modules/user/routes.js', 'src/modules/user/routes.js')

# 3. Patch server's userRoutes.js to add service-favorites routes
user_routes = sftp.file(REMOTE_ROOT + '/src/routes/userRoutes.js', 'r').read().decode('utf-8')
if 'service-favorites' not in user_routes:
    patch = """
// 服务/服务商收藏
router.post('/service-favorites', fpCtrl.addServiceFav);
router.post('/service-favorites/remove', fpCtrl.removeServiceFav);
router.get('/service-favorites', fpCtrl.getServiceFavs);
router.post('/service-favorites/batch', fpCtrl.batchServiceFavs);
router.get('/service-favorites/check', fpCtrl.checkServiceFav);

"""
    user_routes = user_routes.replace('module.exports = router;', patch + 'module.exports = router;')
    with sftp.file(REMOTE_ROOT + '/src/routes/userRoutes.js', 'w') as f:
        f.write(user_routes)
    print('OK: server userRoutes.js patched')
else:
    print('SKIP: service-favorites already in server routes')

sftp.close()

# 4. Restart
run('kill $(lsof -t -i:3001) 2>/dev/null; kill $(lsof -t -i:3002) 2>/dev/null')
time.sleep(2)
stdin, stdout, stderr = s.exec_command('cd /root/community-backend/backend && nohup node src/index.js > /tmp/community-backend.log 2>&1 & echo $!', timeout=5)
try:
    print("PID:", stdout.read().decode().strip())
except:
    print("Started")

time.sleep(5)
run('curl -sk https://localhost:3001/api/v1/user/service-favorites -H "Authorization: Bearer test"')

s.close()
print("Done")
