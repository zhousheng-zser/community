import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# 找出在哪里拼了绝对 URL
print('=== 搜索 icon_url 拼接绝对 URL 的代码 ===')
print(run('grep -rn "icon_url\\|baseUrl\\|toAbsolute\\|120\\.27\\|req\\.protocol\\|uploads" /root/community-backend/backend/src/modules/core/ 2>/dev/null | head -40'))

print('\n=== 服务器的 coreDataController icon_url 相关 ===')
print(run('grep -n "icon_url\\|uploads\\|https://" /root/community-backend/backend/src/controllers/coreDataController.js 2>/dev/null | head -30'))

# 查看 modules/core 的 routes 和 controllers
print('\n=== modules/core/routes.js ===')
print(run('cat /root/community-backend/backend/src/modules/core/routes.js 2>/dev/null'))

print('\n=== modules/core/controllers/ ===')
print(run('ls /root/community-backend/backend/src/modules/core/controllers/ 2>/dev/null'))
print(run('grep -n "icon_url\\|uploads\\|baseUrl\\|https://" /root/community-backend/backend/src/modules/core/controllers/*.js 2>/dev/null | head -30'))

# 看 service_home_modules 表中实际存的 icon_url 值
print('\n=== DB service_home_modules icon_url ===')
print(run('''MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "SELECT group_key, icon_url FROM service_home_modules WHERE icon_url IS NOT NULL LIMIT 5;" 2>/dev/null'''))

c.close()
print('\n[DONE]')
