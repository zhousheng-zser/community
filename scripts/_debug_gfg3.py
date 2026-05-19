import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules | head -c 150',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/tidy | head -c 200',
    'grep -n "getServiceGroup\\|resolveServiceGroup" /root/community-backend/backend/src/routes/*.js /root/community-backend/backend/src/modules/**/*.js 2>/dev/null | head -20',
    'ls -la /root/community-backend/backend/src/models/ | grep -i service',
    'grep ServiceHomeModule /root/community-backend/backend/src/models/index.js',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=25)
    print('===', cmd[:80])
    out = o.read().decode('utf-8', 'replace')
    print(out[:800] if out else '(empty)')
c.close()
