import paramiko
import urllib.request
import json

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'ss -lntp | grep -E "3001|3002|3000"',
    'curl -s http://127.0.0.1:3001/api/v1/core/service-groups/gfg | head -c 200',
    'curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg 2>/dev/null | head -c 200',
    'curl -s http://127.0.0.1:3001/api/v1/core/service-home-modules | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get(\\"data\\",[])))"',
    'grep -r "service-groups" /etc/nginx/ 2>/dev/null | head -5',
    'ps aux | grep -E "node|pm2" | grep -v grep | head -8',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=25)
    print('===', cmd[:75])
    print(o.read().decode('utf-8', 'replace')[:600])
c.close()

for url in [
    'https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules',
    'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg',
]:
    r = urllib.request.urlopen(url, timeout=12)
    print('EXT', url.split('/')[-1], r.read()[:120])
