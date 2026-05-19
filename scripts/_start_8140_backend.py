import paramiko
import time

OUT = r'd:\CODE\project\community\scripts\_restart_out.txt'

def log(s):
    with open(OUT, 'a', encoding='utf-8') as f:
        f.write(s + '\n')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'ls -la /root/community-backend/backend/*.cjs /root/community-backend/backend/ecosystem* /root/community-backend/backend/package.json 2>&1',
    'head -5 /root/community-backend/backend/package.json',
    'grep -r "3002\\|3001" /root/community-backend/backend/src/app.js /root/community-backend/backend/.env 2>/dev/null | head -10',
    'cd /root/community-backend/backend && pm2 start src/app.js --name community-api 2>&1 || cd /root/community-backend/backend && pm2 start ecosystem.config.js 2>&1 || cd /root/community-backend/backend && PORT=3002 nohup node src/app.js > /tmp/community-api.log 2>&1 &',
    'sleep 4 && pm2 list && ss -lntp | grep -E "3001|3002"',
    'tail -20 /tmp/community-api.log 2>/dev/null',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg | head -c 250',
]
open(OUT, 'w').write('start backend\n')
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=45)
    log('=== ' + cmd[:80])
    log(o.read().decode('utf-8', 'replace'))
    err = e.read().decode('utf-8', 'replace')
    if err.strip():
        log('stderr: ' + err[:500])
c.close()

import urllib.request
time.sleep(3)
for u in ['https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules', 'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg']:
    try:
        r = urllib.request.urlopen(u, timeout=12)
        log(u.split('/')[-1] + ' OK ' + r.read().decode()[:200])
    except Exception as ex:
        log(u.split('/')[-1] + ' FAIL ' + str(ex))
