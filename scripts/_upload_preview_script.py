import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)
sftp = ssh.open_sftp()

# Upload wechat-preview.js
local = r'D:\CODE\project\community\scripts\wechat-preview.js'
remote_dir = '/root/community-backend/scripts'

try:
    sftp.stat(remote_dir)
except FileNotFoundError:
    sftp.mkdir(remote_dir)

sftp.put(local, remote_dir + '/wechat-preview.js')
print('Uploaded wechat-preview.js')

sftp.close()
ssh.close()
print('Done')
