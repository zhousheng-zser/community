import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    'pm2 list --no-color',
    'ss -tlnp | grep -E "3001|3002"',
    'grep -rn login_password /root/community-backend/backend/src --include="*.js" | head -15',
    'pm2 logs ecosystem.benefit.pm2 --lines 40 --nostream 2>&1 | tail -45',
]
for cmd in cmds:
    print('>>>', cmd[:70])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=25)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    if out: print(out[:2500])
    if err and 'Warning' not in err: print('ERR', err[:300])
    print()
c.close()
