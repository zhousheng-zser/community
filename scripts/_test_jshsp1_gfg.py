import sys, paramiko, urllib.request, ssl, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. 先确认当前 jshsp1 域名解析
import socket
try:
    ip = socket.gethostbyname('jshsp1.eds-tech.cn')
    print(f"jshsp1.eds-tech.cn → {ip}")
except Exception as e:
    print(f"DNS 解析失败: {e}")

# 2. 测试外网 API
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    'https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules',
    'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg',
    'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/tidy',
]
for url in urls:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            body = r.read()[:500].decode('utf-8', 'replace')
            print(f"\n[{r.status}] {url}")
            print(body)
    except Exception as e:
        print(f"\n[ERROR] {url}: {e}")

# 3. 连 120 查看 nohup.out 最新日志
print("\n=== 120 nohup.out 最新 ===")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command('tail -20 /root/community-backend/backend/nohup.out', timeout=10)
print(o.read().decode('utf-8', 'replace'))

# 4. 查 8140 是否有 nginx proxy_pass 到 120
print("\n=== 8140 nginx proxy 配置 ===")
c8140 = paramiko.SSHClient()
c8140.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c8140.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=15, look_for_keys=False, allow_agent=False)
def run8140(cmd):
    _, o, _ = c8140.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace').strip()

print(run8140('grep -r "proxy_pass\\|120.27.239\\|3001\\|3002" /www/server/nginx/conf/ 2>/dev/null | grep -v "#" | head -20'))
print(run8140('grep -r "proxy_pass\\|120.27.239\\|3001\\|3002" /etc/nginx/ 2>/dev/null | grep -v "#" | head -20'))
print(run8140('find /www/server/panel/vhost/nginx/ -name "*.conf" 2>/dev/null | head -10'))
print(run8140('ls /www/server/panel/vhost/nginx/ 2>/dev/null'))

c.close()
c8140.close()
print("\n[DONE]")
