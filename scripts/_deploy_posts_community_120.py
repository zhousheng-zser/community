"""部署帖子按小区隔离到 120"""
import os, sys, time, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE = '/root/community-backend/backend'
FILES = [
    'backend/src/controllers/postController.js',
    'backend/src/routes/postRoutes.js',
    'backend/src/models/post.js',
]
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=25, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
for rel in FILES:
    sftp.put(os.path.join(LOCAL, rel.replace('/', os.sep)), f'{REMOTE}/{rel.split("backend/",1)[1]}')
    print('[up]', rel)
sftp.close()
sql = open(os.path.join(LOCAL, 'backend/sql/0432_posts_community_id.sql'), encoding='utf-8').read()
_, so, _ = c.exec_command('cat > /tmp/0432_posts.sql', timeout=5)
so.channel.send(sql.encode('utf-8')); so.channel.shutdown_write(); so.read()
def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=20)
    return (o.read()+e.read()).decode('utf-8','replace').strip()
print('[sql]', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db < /tmp/0432_posts.sql 2>&1')[:300])
run('pkill -9 -f "node src/index.js" || true'); time.sleep(2)
c.exec_command(f'setsid bash -c "cd {REMOTE} && node src/index.js >> nohup.out 2>&1" &')
time.sleep(5)
print('[posts]', run('curl -s "http://127.0.0.1:3002/api/v1/posts?category=test&community_id=1&limit=1"')[:200])
c.close()
print('[DONE]')
