"""部署帖子详情 API"""
import paramiko, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HOST = '120.27.239.244'
REMOTE = '/root/community-backend/backend'
LOCAL = os.path.join(os.path.dirname(__file__), '..', 'backend')
FILES = ['src/controllers/postController.js', 'src/routes/postRoutes.js']
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=8):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

sftp = c.open_sftp()
for rel in FILES:
    sftp.put(os.path.join(LOCAL, rel.replace('/', os.sep)), REMOTE + '/' + rel)
    print('[OK]', rel)
sftp.close()
run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 &', t=3)
time.sleep(4)
print(run('pgrep -af "node src/index.js" | grep src/index | head -1'))
c.close()
