import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

# 1. coreDataRoutes.js
print("=== src/routes/coreDataRoutes.js ===")
print(run('cat /root/community-backend/backend/src/routes/coreDataRoutes.js 2>/dev/null'))

# 2. 查看 node 进程的实时 stdout/stderr 日志（nohup.out）
print("\n=== nohup.out 最后30行 ===")
print(run('tail -30 /root/community-backend/backend/nohup.out 2>/dev/null'))

# 3. 直接触发请求看报错
print("\n=== 触发 gfg 请求后查日志 ===")
run('curl -sk https://127.0.0.1:3001/api/v1/core/service-groups/gfg > /dev/null 2>&1 &')
import time; time.sleep(2)
print(run('tail -20 /root/community-backend/backend/nohup.out 2>/dev/null'))

# 4. 检查 Categories 和 Services 表是否存在
def mq(sql):
    _, so, se = c.exec_command('cat > /tmp/_mq.sql', timeout=5)
    so.channel.send(sql.encode('utf-8'))
    so.channel.shutdown_write()
    so.read(); se.read()
    return run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/_mq.sql 2>&1')

print("\n=== SHOW TABLES ===")
print(mq("SHOW TABLES LIKE '%ategori%';"))
print(mq("SHOW TABLES LIKE '%ervice%';"))

# 5. 检查 coreDataController 中 getServiceGroup 用到的 model 名称
print("\n=== coreDataController getServiceGroup ===")
print(run('grep -n "getServiceGroup\\|Category\\|Categories\\|findAll.*group_type" /root/community-backend/backend/src/controllers/coreDataController.js 2>/dev/null | head -20'))

# 6. 检查模型
print("\n=== models/index.js ===")
print(run('ls /root/community-backend/backend/src/models/ 2>/dev/null'))

# 7. Category 模型 tableName
print("\n=== Category 模型 ===")
print(run('cat /root/community-backend/backend/src/models/category.js 2>/dev/null'))

c.close()
print("\n[DONE]")
