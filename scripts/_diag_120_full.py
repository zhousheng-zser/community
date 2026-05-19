import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

# 1. 查看 3001 端口是什么进程
print("=== 3001/3002 端口进程 ===")
print(run('ps aux | grep -E "node|python|nginx" | grep -v grep | head -20'))

print("\n=== lsof 端口 ===")
print(run('lsof -i:3001 -i:3002 2>/dev/null | head -10'))

# 2. 查看 nginx 配置（jshsp1 是否指向 120）
print("\n=== nginx 配置 ===")
print(run('cat /etc/nginx/conf.d/*.conf 2>/dev/null | grep -A5 -B2 "3001\\|proxy_pass\\|server_name" | head -40'))
print(run('cat /www/server/nginx/conf/vhost/*.conf 2>/dev/null | grep -A5 -B2 "3001\\|proxy_pass" | head -40'))

# 3. 后端启动方式
print("\n=== 后端目录 ===")
print(run('ls /root/community-backend/backend/ 2>/dev/null'))
print(run('cat /root/community-backend/backend/package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get(\'scripts\', {}))"'))

# 4. 当前运行的 node 进程
print("\n=== Node 进程 ===")
print(run('ps aux | grep node | grep -v grep'))

# 5. 试直接访问 API
print("\n=== curl 测试 ===")
print(run('curl -sv http://127.0.0.1:3001/api/v1/core/service-groups/gfg 2>&1 | head -c 800'))

# 6. 试 3002
print("\n=== curl 3002 ===")
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg 2>&1 | head -c 500'))

# 7. 检查 src/routes/index.js 是否有 coreData 路由
print("\n=== routes/index.js ===")
print(run('cat /root/community-backend/backend/src/routes/index.js 2>/dev/null | grep -E "core|service|group" | head -15'))

# 8. icon 文件路径
print("\n=== icon 文件检查 ===")
print(run('ls /root/community-backend/backend/data/uploads/images/ 2>/dev/null | grep "1779113700" | head -5'))
print(run('ls /root/community-backend/backend/data/uploads/ 2>/dev/null'))

# 9. 静态文件服务配置
print("\n=== app.js static 路径配置 ===")
print(run('grep -n "static\\|uploads\\|express.static" /root/community-backend/backend/src/app.js 2>/dev/null | head -10'))

c.close()
print("\n[DONE]")
