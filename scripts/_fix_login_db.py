import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    "mysql -uroot -pCommunityPwd123! community_db -e 'SHOW TABLES LIKE \"%ser%\";' 2>&1",
    "grep -n tableName /root/community-backend/backend/src/models/user.js 2>/dev/null | head -5",
    'cat /root/community-backend/backend/.env | grep -i mysql',
    'grep proxy_pass /www/server/panel/vhost/nginx/extension/community-backend/*.conf 2>/dev/null',
    'cat /www/server/panel/vhost/nginx/extension/community-backend/*.conf 2>/dev/null',
]
for cmd in cmds:
    print('>>>', cmd[:70])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=20)
    print(stdout.read().decode('utf-8', 'replace')[:2000])
    print()
c.close()
