import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

# 1. 所有 node src/index.js 进程
print("=== 所有 node backend 进程 ===")
print(run('ps aux | grep "node src/index.js" | grep -v grep'))

# 2. 查找全部 nginx 配置
print("\n=== 全部 nginx 配置文件 ===")
print(run('find /www/server/nginx /etc/nginx -name "*.conf" 2>/dev/null | xargs grep -l "jshsp1\\|3001\\|3002" 2>/dev/null'))

# 3. 直接 grep nginx 配置
print("\n=== grep proxy_pass in nginx ===")
print(run('grep -r "proxy_pass\\|server_name.*jshsp1\\|3001\\|3002" /www/server/nginx/conf/ 2>/dev/null | grep -v "#" | head -30'))

# 4. main nginx.conf
print("\n=== nginx.conf include ===")
print(run('grep -n "include\\|server_name\\|3001\\|3002\\|proxy" /www/server/nginx/conf/nginx.conf 2>/dev/null | head -20'))

# 5. 检查是否有宝塔网站配置
print("\n=== 宝塔 site 配置 ===")
print(run('ls /www/server/panel/vhost/nginx/ 2>/dev/null'))

# 6. 测试不同端口
print("\n=== 测试 HTTPS 3001 ===")
print(run('curl -sk https://127.0.0.1:3001/api/v1/core/service-groups/gfg 2>&1 | head -c 400'))

# 7. 检查 443 端口
print("\n=== 443 端口进程 ===")
print(run('ss -tlnp | grep 443'))
print(run('curl -sk https://127.0.0.1:443/api/v1/core/service-groups/gfg 2>&1 | head -c 400'))

# 8. nohup.out 新日志（有无新的 gfg 请求）
print("\n=== nohup.out 最新 ===")
print(run('tail -15 /root/community-backend/backend/nohup.out'))

c.close()
print("\n[DONE]")
