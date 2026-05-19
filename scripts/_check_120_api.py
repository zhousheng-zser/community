import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

print('=== node 进程 ===')
print(run('ps aux | grep node | grep -v grep | grep -v cursor'))

print('\n=== 3002 service-home-modules ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')[:800])

print('\n=== 3002 service-groups/gfg ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')[:600])

print('\n=== 3002 service-groups/tidy ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/tidy')[:400])

print('\n=== categories 表 ===')
def mq(sql):
    _, so, _ = c.exec_command('cat > /tmp/_mq.sql', timeout=5)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read()
    return run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/_mq.sql 2>&1')

print(mq("SELECT id, name, group_type, icon_url FROM categories ORDER BY id;"))

print('\n=== services 表(gfg/ddsd) ===')
print(mq("SELECT s.id, s.title, s.is_published, c.group_type FROM services s JOIN categories c ON s.category_id=c.id WHERE c.group_type IN ('gfg','ddsd') ORDER BY s.id;"))

print('\n=== service_home_modules ===')
print(mq("SELECT group_key, title, icon_url, is_active FROM service_home_modules ORDER BY sort_order;"))

print('\n=== nohup 最新 ===')
print(run('tail -15 /root/community-backend/backend/nohup.out'))

c.close()
print('\n[DONE]')
