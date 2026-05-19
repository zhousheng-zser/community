import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

# nginx 配置
print('=== nginx 配置文件 ===')
print(run("cat /etc/nginx/nginx.conf | head -80"))
print('\n=== sites-available ===')
print(run("ls /etc/nginx/sites-available/ 2>/dev/null && cat /etc/nginx/sites-available/* 2>/dev/null | head -100"))

# admin vite config 代理
print('\n=== admin vite.config ===')
print(run("cat /root/community-backend/admin/vite.config.js 2>/dev/null || cat /root/community-backend/admin/vite.config.ts 2>/dev/null"))

print('\n=== admin .env ===')
print(run("cat /root/community-backend/admin/.env 2>/dev/null || cat /root/community-backend/admin/.env.production 2>/dev/null || echo 'no env'"))
c.close()
