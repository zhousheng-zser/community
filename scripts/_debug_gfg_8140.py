import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'grep tableName /root/community-backend/backend/src/models/serviceHomeModule.js',
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT * FROM service_home_modules WHERE group_key='gfg'\"",
    'pm2 restart all 2>&1 | tail -3',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=40)
    print('===', cmd[:70])
    print(o.read().decode('utf-8', 'replace'))
    err = e.read().decode('utf-8', 'replace')
    if err:
        print('stderr:', err[:200])
c.close()

import time
import urllib.request
import json

time.sleep(4)
r = urllib.request.urlopen('https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg', timeout=15)
print('API gfg:', r.read()[:400])
