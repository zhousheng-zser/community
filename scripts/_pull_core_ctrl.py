import paramiko, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# 拉取服务器上已修复的 coreDataController.js
src = '/root/community-backend/backend/src/controllers/coreDataController.js'
dst = os.path.join(LOCAL, 'backend', 'src', 'controllers', 'coreDataController.js')
sftp.get(src, dst)
print(f'[OK] 拉取 coreDataController.js')

sftp.close()
c.close()
print('[DONE]')
