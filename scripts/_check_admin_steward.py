import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, o, _ = c.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace').strip()

print('admin views:', run('ls /root/community-backend/admin/src/views/ 2>&1 | head -25'))
print('router:', run('grep steward /root/community-backend/admin/src/router/index.js 2>&1'))
print('layout menu:', run('grep steward /root/community-backend/admin/src/layout/index.vue 2>&1'))
c.close()
