import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
cmds = [
    'grep -n "service-orders\\|dispatch\\|adminServiceHome" /root/community-backend/backend/src/index.js | head -30',
    'ls /root/community-backend/backend/src/routes/admin*.js 2>&1',
    'grep -rn "dispatch-queue\\|assign" /root/community-backend/backend/src/routes /root/community-backend/backend/src --include="*.js" 2>/dev/null | head -25',
    'head -5 /root/community-backend/backend/src/models/ServiceOrder.js',
    'pm2 list 2>/dev/null | head -8',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=25)
    print('===', cmd[:70])
    print(o.read().decode('utf-8', 'replace')[:1200])
c.close()
