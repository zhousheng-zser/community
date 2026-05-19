import paramiko, os, sys, io, json, urllib.request, ssl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = r'd:\CODE\project\community'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)

# pull authController
sftp = c.open_sftp()
sftp.get('/root/community-backend/backend/src/controllers/authController.js',
         os.path.join(ROOT, 'backend/src/controllers/authController.js'))
sftp.get('/root/community-backend/backend/src/routes/authRoutes.js',
         os.path.join(ROOT, 'backend/src/routes/authRoutes.js'))
sftp.close()

# get pm2 error after login attempt
stdin, stdout, stderr = c.exec_command(
    "curl -sk -X POST http://127.0.0.1:3002/api/v1/auth/login_password -H 'Content-Type: application/json' -d '{\"phone\":\"13800000000\",\"password\":\"123456\"}'",
    timeout=15
)
print('3002 login:', stdout.read().decode()[:400])

stdin, stdout, stderr = c.exec_command(
    "curl -sk -X POST http://127.0.0.1:3001/api/v1/auth/login_password -H 'Content-Type: application/json' -d '{\"phone\":\"13800000000\",\"password\":\"123456\"}'",
    timeout=15
)
print('3001 login:', stdout.read().decode()[:400])

stdin, stdout, stderr = c.exec_command(
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT id,phone,LEFT(password,20) pw FROM Users WHERE phone LIKE '138%' LIMIT 5;\" 2>&1",
    timeout=15
)
print('users:', stdout.read().decode())

stdin, stdout, stderr = c.exec_command('pm2 logs ecosystem.benefit.pm2 --lines 30 --nostream 2>&1', timeout=20)
print('logs:', stdout.read().decode()[-2000:])
c.close()
