import sys, paramiko, urllib.request, ssl
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

# 1. 查看 modules/core 目录
print("=== src/modules/core/ 目录 ===")
print(run('ls /root/community-backend/backend/src/modules/core/ 2>/dev/null'))

# 2. getServiceGroup 实现（找 icon_url 处理逻辑）
print("\n=== modules/core getServiceGroup icon_url 逻辑 ===")
print(run('grep -n "icon_url\\|uploads\\|normalizeUrl\\|baseUrl\\|server\\|req.protocol" /root/community-backend/backend/src/modules/core/routes.js 2>/dev/null | head -20'))

# 找到具体文件
print("\n=== 查找 icon_url 返回的地方 ===")
print(run('grep -rn "icon_url.*120\\|120.*icon_url\\|baseUrl\\|serverUrl\\|host.*3001\\|3001.*host" /root/community-backend/backend/src/modules/core/ 2>/dev/null | head -20'))

# 3. 检查 nginx 配置（宝塔面板路径）
print("\n=== nginx vhost 配置 ===")
print(run('ls /www/server/nginx/conf/vhost/ 2>/dev/null'))
print(run('cat /www/server/nginx/conf/vhost/jshsp1.eds-tech.cn.conf 2>/dev/null | head -50'))

# 4. 检查 .env 文件
print("\n=== backend .env ===")
print(run('cat /root/community-backend/backend/.env 2>/dev/null | grep -E "PORT|HOST|BASE_URL|BACKEND"'))

# 5. 测试 jshsp1 外网 API
print("\n=== jshsp1 外网 API 测试 ===")
print(run('curl -sk https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg 2>&1 | head -c 500'))
print("\n=== jshsp1 service-home-modules ===")
print(run('curl -sk https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules 2>&1 | head -c 500'))

c.close()
print("\n[DONE]")
