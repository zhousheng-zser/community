import paramiko
import time
import urllib.request

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'cd /root/community-backend/backend && pm2 list 2>/dev/null',
    'cd /root/community-backend/backend && ls ecosystem*.js pm2*.cjs 2>/dev/null',
    'ps aux | grep MainThread | grep -v grep',
    'cd /root/community-backend/backend && (pm2 restart ecosystem.config.js 2>/dev/null || pm2 restart all 2>/dev/null || (pkill -f "node.*backend" 2>/dev/null; sleep 1; nohup node src/app.js >> /tmp/backend.log 2>&1 &))',
    'sleep 3 && ss -lntp | grep 3002',
]
open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'w').write('')
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=40)
    print('===', cmd[:70])
    open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'a', encoding='utf-8').write(o.read().decode('utf-8', 'replace')[:2000])
c.close()

for i in range(8):
    time.sleep(2)
    try:
        r = urllib.request.urlopen('https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg', timeout=10)
        open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'a', encoding='utf-8').write('gfg ' + r.read().decode()[:300])
        break
    except Exception as ex:
        open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'a', encoding='utf-8').write(f'try {i} {ex}\n')
