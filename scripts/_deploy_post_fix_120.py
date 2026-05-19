"""部署 postController 修复"""
import paramiko, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HOST = '120.27.239.244'
REMOTE = '/root/community-backend/backend'
LOCAL = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src', 'controllers', 'postController.js')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=12):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

sftp = c.open_sftp()
sftp.put(LOCAL, REMOTE + '/src/controllers/postController.js')
sftp.close()
run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 & echo ok', t=5)
time.sleep(3)
print('deployed', run('pgrep -af "node src/index.js" | grep src/index | head -1'))
c.close()
