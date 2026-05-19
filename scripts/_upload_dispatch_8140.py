import os
import paramiko

HOST = '8.140.204.254'
PWD = 'edS904062'
BASE_LOCAL = r'd:\CODE\project\community\backend'
BASE_REMOTE = '/root/community-backend/backend'

files = [
    'src/modules/service-order/adminDispatch.routes.js',
    'src/index.js',
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', PWD, timeout=12, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

for rel in files:
    local = os.path.join(BASE_LOCAL, rel.replace('/', os.sep))
    remote = BASE_REMOTE + '/' + rel
    remote_dir = os.path.dirname(remote)
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        # mkdir -p via ssh
        c.exec_command(f'mkdir -p {remote_dir}')
    if os.path.isfile(local):
        sftp.put(local, remote)
        print('uploaded', rel)
    else:
        print('MISSING local', rel)

sftp.close()
_, o, e = c.exec_command(
    'cd /root/community-backend/backend && pm2 delete all 2>/dev/null; '
    'pm2 start ecosystem.benefit.pm2.cjs --only community-benefit-api 2>&1 || '
    'pm2 start src/index.js --name community-benefit-api 2>&1; '
    'sleep 6; ss -lntp | grep -E "3001|3002"; '
    'curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules | head -c 180; echo; '
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg | head -c 180',
    timeout=60
)
out = o.read().decode('utf-8', 'replace')
open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'w', encoding='utf-8').write(out)
c.close()
