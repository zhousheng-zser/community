import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

def mq(sql, db='community_db'):
    # 写 SQL 到 tmp 文件
    _, so, se = c.exec_command('cat > /tmp/_mq.sql', timeout=5)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read(); se.read()
    return run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/_mq.sql 2>&1')

# 列出所有表
print("=== community_db 所有表 ===")
print(mq("SHOW TABLES;"))

# 检查 uploads 目录结构
print("\n=== uploads 目录 ===")
print(run('find /root/community-backend -name "uploads" -type d 2>/dev/null | head -5'))
print(run('ls /root/community-backend/backend/data/uploads/ 2>/dev/null | head -20'))

# PM2 日志（最后30行）
print("\n=== PM2 日志 ===")
print(run('pm2 logs --lines 20 --nostream 2>&1 | tail -30'))

c.close()
