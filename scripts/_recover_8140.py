import paramiko

OUT = r'd:\CODE\project\community\scripts\_restart_out.txt'

def log(s):
    with open(OUT, 'a', encoding='utf-8') as f:
        f.write(s + '\n')

open(OUT, 'w').write('recover\n')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'pm2 delete all 2>/dev/null; true',
    'sed -n "75,95p" /root/community-backend/backend/src/routes/index.js',
    'ls /root/community-backend/backend/index.js /root/community-backend/backend/src/index.js 2>&1',
    'cat /root/community-backend/backend/ecosystem.benefit.pm2.cjs',
    'grep -r "MainThread\\|3002" /root/community-backend/backend/package.json /root/community-backend/backend/src/*.js 2>/dev/null | head -15',
    'cd /root/community-backend/backend && pm2 start ecosystem.benefit.pm2.cjs 2>&1',
    'sleep 5 && pm2 list && ss -lntp | grep -E "3001|3002"',
    'pm2 logs --lines 15 --nostream 2>&1',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules | head -c 200',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg | head -c 200',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=50)
    log('=== ' + cmd[:75])
    log(o.read().decode('utf-8', 'replace'))
c.close()
