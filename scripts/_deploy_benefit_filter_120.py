import os
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=15, look_for_keys=False, allow_agent=False)
local = r'd:\CODE\project\community\backend\src\modules\benefit-card\controllers\benefitAlliance.controller.js'
remote = '/root/community-backend/backend/src/modules/benefit-card/controllers/benefitAlliance.controller.js'
sftp = c.open_sftp()
sftp.put(local, remote)
sftp.close()
_, o, _ = c.exec_command('cd /root/community-backend/backend && pm2 restart ecosystem.benefit.pm2 2>&1 | tail -3', timeout=30)
print(o.read().decode('utf-8', 'replace'))
c.close()
