"""部署 P2 修复：coreDataController 雪花 ID"""
import paramiko, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
REMOTE = '/root/community-backend/backend'
LOCAL = os.path.join(os.path.dirname(__file__), '..', 'backend')

FILES = ['src/controllers/coreDataController.js']

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=25):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

sftp = c.open_sftp()
for rel in FILES:
    lp = os.path.join(LOCAL, rel.replace('/', os.sep))
    rp = REMOTE + '/' + rel.replace('\\', '/')
    sftp.put(lp, rp)
    print('[OK]', rel)
sftp.close()

run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 &')
time.sleep(4)
print('proc:', run('pgrep -af "node src/index.js" | grep src/index'))
c.close()
print('\n[DONE] coreDataController deployed')
