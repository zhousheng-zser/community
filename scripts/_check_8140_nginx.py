import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=15):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

# 1. node_community-backend.conf 完整内容
print("=== node_community-backend.conf ===")
print(run('cat /www/server/panel/vhost/nginx/node_community-backend.conf 2>/dev/null'))

# 2. 所有 vhost conf 中找 jshsp1 或 3001/3002
print("\n=== 所有 vhost grep jshsp1 ===")
print(run('grep -rn "jshsp1\\|server_name" /www/server/panel/vhost/nginx/ 2>/dev/null | grep -v "#" | head -30'))

# 3. jshsp2.eds-tech.cn.conf
print("\n=== html_jshsp2.eds-tech.cn.conf ===")
print(run('cat /www/server/panel/vhost/nginx/html_jshsp2.eds-tech.cn.conf 2>/dev/null | head -30'))

# 4. 8140 的 node backend 状态
print("\n=== 8140 node 进程 ===")
print(run('ps aux | grep node | grep -v grep | head -10'))

# 5. 8140 本地 API 测试
print("\n=== 8140 本地 service-groups/gfg ===")
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg 2>&1 | head -c 300'))
print(run('curl -s http://127.0.0.1:3001/api/v1/core/service-groups/gfg 2>&1 | head -c 300'))

# 6. 从 120 解析 jshsp1
print("\n=== 从 8140 服务器 DNS 解析 jshsp1 ===")
print(run('nslookup jshsp1.eds-tech.cn 2>/dev/null || dig jshsp1.eds-tech.cn +short 2>/dev/null'))

c.close()
print("\n[DONE]")
