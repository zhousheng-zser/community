import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)
sftp = ssh.open_sftp()

local = r'D:\CODE\project\community\backend\src\modules\service-provider-portal\controllers\serviceProvider.controller.js'
remote = '/root/community-backend/backend/src/modules/service-provider-portal/controllers/serviceProvider.controller.js'
sftp.put(local, remote)
print('Uploaded serviceProvider.controller.js')
sftp.close()

cmd = 'cd /root/community-backend && pm2 restart all 2>&1'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode().strip())
err = stderr.read().decode().strip()
if err:
    print('STDERR:', err)

ssh.close()
print('Done')
