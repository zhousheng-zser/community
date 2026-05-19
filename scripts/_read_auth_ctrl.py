import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
stdin, stdout, stderr = c.exec_command('wc -l /root/community-backend/backend/src/controllers/authController.js; head -5 /root/community-backend/backend/src/index.js', timeout=15)
print(stdout.read().decode())
# trigger login with real test and capture log
stdin, stdout, stderr = c.exec_command(
    'curl -sk -X POST https://jshsp1.eds-tech.cn/api/v1/auth/login_password -H "Content-Type: application/json" -d \'{"phone":"13800000000","password":"test"}\' 2>&1',
    timeout=15
)
print('jshsp1:', stdout.read().decode()[:300])
stdin, stdout, stderr = c.exec_command('grep -r jshsp1 /etc/nginx 2>/dev/null | head -10', timeout=15)
print('nginx:', stdout.read().decode()[:800])
c.close()
