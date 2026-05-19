import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
try:
    sftp.get('/root/community-backend/backend/src/index.js', r'd:\CODE\project\community\backend\src\index.js')
    print('ok')
except Exception as e:
    print('fail', e)
sftp.close()
c.close()
