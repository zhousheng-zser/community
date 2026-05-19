import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
cmds = [
    'pm2 list --no-color',
    'ss -tlnp 2>/dev/null | head -20',
    'test -d /root/community-backend/admin/dist && echo HAS_DIST || echo NO_DIST',
    'head -5 /root/community-backend/admin/package.json 2>/dev/null',
]
for cmd in cmds:
    print('>>>', cmd)
    stdin, stdout, stderr = c.exec_command(cmd, timeout=15)
    print(stdout.read().decode('utf-8', 'replace')[:1200])
    print()
c.close()
