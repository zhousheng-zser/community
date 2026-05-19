import paramiko
import urllib.request
import json
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

sql = """
ALTER TABLE service_home_modules
  ADD COLUMN IF NOT EXISTS createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
""".replace('\n', ' ')

# MySQL 5.7 may not support IF NOT EXISTS for columns - use procedure
cmds = [
    "mysql -uroot -pCommunityPwd123! community_db -e \"SHOW COLUMNS FROM service_home_modules\"",
    """mysql -uroot -pCommunityPwd123! community_db -e "
ALTER TABLE service_home_modules ADD COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP;
" 2>&1 || true""",
    """mysql -uroot -pCommunityPwd123! community_db -e "
ALTER TABLE service_home_modules ADD COLUMN updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
" 2>&1 || true""",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SHOW COLUMNS FROM service_home_modules\"",
    'kill -HUP $(ss -lntp | grep 3002 | grep -oP "pid=\\K[0-9]+") 2>/dev/null || true',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=30)
    print(o.read().decode('utf-8', 'replace'))
    err = e.read().decode('utf-8', 'replace')
    if err and 'Warning' not in err:
        print('stderr:', err[:200])
c.close()

time.sleep(2)
for path in ['service-home-modules', 'service-groups/gfg']:
    r = urllib.request.urlopen(f'https://jshsp1.eds-tech.cn/api/v1/core/{path}', timeout=15)
    print(path, r.read()[:180])
