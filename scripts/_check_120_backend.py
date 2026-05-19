import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

def mq(sql):
    _, so, se = c.exec_command('cat > /tmp/_mq120.sql', timeout=5)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read(); se.read()
    return run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/_mq120.sql 2>&1')

print("=== PM2 进程 ===")
print(run('pm2 list 2>&1'))

print("\n=== 端口监听 ===")
print(run('ss -tlnp | grep -E "3001|3002|8080"'))

print("\n=== service-groups/gfg (本地) ===")
print(run('curl -s http://127.0.0.1:3001/api/v1/core/service-groups/gfg 2>&1 | head -c 500'))

print("\n=== service-groups/tidy (本地) ===")
print(run('curl -s http://127.0.0.1:3001/api/v1/core/service-groups/tidy 2>&1 | head -c 300'))

print("\n=== service-home-modules ===")
print(run('curl -s http://127.0.0.1:3001/api/v1/core/service-home-modules 2>&1 | head -c 600'))

print("\n=== Categories 表 (gfg/ddsd) ===")
print(mq("SELECT id, name, group_type, icon_url FROM Categories WHERE group_type IN ('gfg','ddsd') ORDER BY id;"))

print("\n=== Services 表 (gfg/ddsd) ===")
print(mq("SELECT s.id, s.title, s.is_published, c.group_type FROM Services s JOIN Categories c ON s.category_id=c.id WHERE c.group_type IN ('gfg','ddsd') ORDER BY s.id;"))

print("\n=== uploads 目录 ===")
print(run('ls /root/community-backend/backend/data/uploads/ 2>/dev/null | head -20'))
print(run('find /root/community-backend/backend/data/uploads -name "file-1779113700233*" 2>/dev/null'))

print("\n=== PM2 日志尾部 ===")
print(run('pm2 logs --nostream --lines 20 2>&1 | tail -25'))

c.close()
print("\n[DONE]")
