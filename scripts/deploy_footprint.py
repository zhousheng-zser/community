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

# 1. Create browse_footprints table
create_table_sql = """CREATE TABLE IF NOT EXISTS browse_footprints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  dedupe_key VARCHAR(128) NOT NULL,
  title VARCHAR(200) DEFAULT '',
  cover VARCHAR(500) DEFAULT '',
  url VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_dedupe (user_id, dedupe_key),
  INDEX idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"""

with sftp.file('/tmp/create_footprint.sql', 'w') as f:
    f.write(create_table_sql)
sftp.close()

run("mysql -uroot -p'CommunityPwd123!' community_db < /tmp/create_footprint.sql 2>&1")
run("mysql -uroot -p'CommunityPwd123!' community_db -e 'DESCRIBE browse_footprints;' 2>&1")

# 2. Upload files
sftp = s.open_sftp()
upload('backend/src/modules/user/models/BrowseFootprint.js', 'src/modules/user/models/BrowseFootprint.js')
upload('backend/src/modules/user/controllers/user.controller.js', 'src/modules/user/controllers/user.controller.js')
upload('backend/src/modules/user/routes.js', 'src/modules/user/routes.js')
sftp.close()

# 3. Also need to register the footprint routes on the main server's userRoutes.js
# Read the server's userRoutes.js
sftp = s.open_sftp()
user_routes_content = sftp.file(REMOTE_ROOT + '/src/routes/userRoutes.js', 'r').read().decode('utf-8')

if 'footprints' not in user_routes_content:
    # Add footprint routes before the module.exports
    footer_routes = """
// 浏览足迹
const fpCtrl = require('../modules/user/controllers/user.controller');
router.post('/footprints', fpCtrl.recordFootprint);
router.post('/footprints/batch', fpCtrl.batchFootprints);
router.get('/footprints', fpCtrl.getFootprints);
router.delete('/footprints', fpCtrl.clearFootprints);

"""
    user_routes_content = user_routes_content.replace(
        'module.exports = router;',
        footer_routes + 'module.exports = router;'
    )
    with sftp.file(REMOTE_ROOT + '/src/routes/userRoutes.js', 'w') as f:
        f.write(user_routes_content)
    print('OK: userRoutes.js patched with footprint routes')
else:
    print('SKIP: footprint routes already in userRoutes.js')

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
run('curl -sk https://localhost:3001/api/v1/user/footprints -H "Authorization: Bearer test"')
run('tail -3 /tmp/community-backend.log')

s.close()
print("Deploy done")
