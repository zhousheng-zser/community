import paramiko, os
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
remote = '/root/community-backend/backend/src/controllers/workerPortalController.js'
local = r'd:\CODE\project\community\backend\src\controllers\workerPortalController.js'
sftp = c.open_sftp()
os.makedirs(os.path.dirname(local), exist_ok=True)
sftp.get(remote, local)
sftp.close()
c.close()
print('ok', os.path.getsize(local))
