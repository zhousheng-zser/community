import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
cmds = [
    "mysql -uroot -pCommunityPwd123! community_db -e 'SHOW TABLES LIKE \"service_home%\";' 2>&1",
    'grep ServiceHomeModule /root/community-backend/backend/src/models/index.js 2>/dev/null | head -5',
    'grep Category /root/community-backend/backend/src/models/index.js 2>/dev/null | head -8',
    'grep adminAuth /root/community-backend/backend/src/routes/adminRoutes.js 2>/dev/null | head -5',
    'head -30 /root/community-backend/backend/src/routes/adminRoutes.js',
]
for cmd in cmds:
    print('>>>', cmd[:70])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=20)
    print(stdout.read().decode('utf-8', 'replace')[:2000])
    print()
c.close()
