import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace').strip()

print('=== index.js steward 挂载 ===')
print(run('grep -n steward /root/community-backend/backend/src/index.js || echo NOT_FOUND'))

print('\n=== routes/index.js steward ===')
print(run('grep -n steward /root/community-backend/backend/src/routes/index.js'))

print('\n=== steward 模块存在 ===')
print(run('ls /root/community-backend/backend/src/modules/steward/ 2>&1'))

print('\n=== DB 表 ===')
print(run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SHOW TABLES LIKE \'community_steward%\';" 2>&1'))

print('\n=== API 路由测试 ===')
print('steward/applications:', run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/v1/steward/applications'))
print('steward/apply POST:', run('curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:3002/api/v1/steward/apply'))

print('\n=== admin StewardApplications.vue ===')
print(run('ls /root/community-backend/admin/src/views/StewardApplications.vue 2>&1'))

c.close()
