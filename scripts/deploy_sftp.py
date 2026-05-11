import paramiko, os, sys

LOCAL_ROOT = r'D:\CODE\project\community'
REMOTE_ROOT = '/root/community-backend'

files_to_upload = [
    'backend/src/modules/user/controllers/user.controller.js',
    'backend/src/modules/user/routes.js',
    'backend/src/modules/market/controllers/market.controller.js',
    'backend/src/modules/service-order/controllers/serviceOrder.controller.js',
    'backend/src/modules/service-provider-portal/controllers/serviceProvider.controller.js',
    'backend/src/modules/neighbor-assist/controllers/neighborAssist.controller.js',
]

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)
sftp = s.open_sftp()

for rel in files_to_upload:
    local_path = os.path.join(LOCAL_ROOT, rel).replace('/', os.sep)
    remote_path = REMOTE_ROOT + '/' + rel
    try:
        remote_dir = '/'.join(remote_path.split('/')[:-1])
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            stdin, stdout, stderr = s.exec_command(f'mkdir -p {remote_dir}')
            stdout.read()
        sftp.put(local_path, remote_path)
        print(f'OK: {rel}')
    except Exception as e:
        print(f'FAIL: {rel} -> {e}')

sftp.close()

# Restart
stdin, stdout, stderr = s.exec_command('pm2 restart community-backend 2>&1', timeout=30)
print(stdout.read().decode('utf-8', 'ignore'))

# Check logs
import time
time.sleep(3)
stdin, stdout, stderr = s.exec_command('pm2 logs community-backend --lines 5 --nostream 2>&1', timeout=15)
print(stdout.read().decode('utf-8', 'ignore'))

s.close()
print("Deploy done")
