import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    'grep -rn service-home-manage /root/community-backend 2>/dev/null | grep -v node_modules | head -25',
    'grep -rn ServiceHomeManage /root/community-backend 2>/dev/null | grep -v node_modules | head -15',
    'grep -rn home-manage /root/community-backend/admin 2>/dev/null | head -15',
    'cat /root/community-backend/admin/src/router/index.js',
]
for cmd in cmds:
    print('=' * 60)
    print(cmd[:80])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=25)
    out = stdout.read().decode('utf-8', 'replace')
    print(out[:4000] if out else '(empty)')
c.close()
