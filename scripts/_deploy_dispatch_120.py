#!/usr/bin/env python3
"""Deploy dispatch + order flow fixes to 120.27.239.244"""
import os
import paramiko

HOST = '120.27.239.244'
PWD = 'cW123456'
BASE_LOCAL = r'd:\CODE\project\community'
BASE_REMOTE = '/root/community-backend'

FILES = [
    ('backend/src/controllers/adminDispatchController.js', 'backend/src/controllers/adminDispatchController.js'),
    ('backend/src/controllers/serviceOrderController.js', 'backend/src/controllers/serviceOrderController.js'),
    ('backend/src/controllers/workerPortalController.js', 'backend/src/controllers/workerPortalController.js'),
    ('admin/src/views/ServiceDispatch.vue', 'community-admin/src/views/ServiceDispatch.vue'),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', PWD, timeout=15, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

for rel_local, rel_remote in FILES:
    local = os.path.join(BASE_LOCAL, rel_local.replace('/', os.sep))
    remote = f'{BASE_REMOTE}/{rel_remote}'
    remote_dir = os.path.dirname(remote)
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        parts = remote_dir.split('/')
        cur = ''
        for p in parts:
            if not p:
                continue
            cur += '/' + p
            try:
                sftp.stat(cur)
            except FileNotFoundError:
                sftp.mkdir(cur)
    if os.path.isfile(local):
        sftp.put(local, remote)
        print('uploaded', rel_remote)
    else:
        print('SKIP missing', local)

sftp.close()

cmd = '''
cd /root/community-backend/backend && pm2 restart community-benefit-api 2>/dev/null || pm2 restart all 2>/dev/null || true
sleep 3
curl -s http://127.0.0.1:3002/api/v1/admin/dispatch-queue -H "Authorization: Bearer skip" 2>/dev/null | head -c 80
'''
_, o, e = c.exec_command(
    'cd /root/community-backend/backend && (pm2 list | grep -q community-benefit-api && pm2 restart community-benefit-api || '
    '(pkill -f "node.*src/index" 2>/dev/null; sleep 1; pm2 start src/index.js --name community-benefit-api 2>/dev/null || '
    'pm2 start ecosystem.benefit.pm2.cjs 2>/dev/null)); sleep 4; pm2 list | head -6',
    timeout=45
)
out = o.read().decode('utf-8', 'replace')
open(os.path.join(BASE_LOCAL, 'scripts', '_deploy_120_out.txt'), 'w', encoding='utf-8').write(out)
print(out[:500])
c.close()
