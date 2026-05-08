#!/usr/bin/env python3
import subprocess, time

HOST = 'cw@192.168.110.50'
def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True)
    print('OUT:', r.stdout[:400])
    if r.stderr: print('ERR:', r.stderr[:200])
    return r.stdout

ssh("pkill -f 'node src/index' 2>/dev/null; echo killed")
time.sleep(2)
ssh("cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 &")
time.sleep(5)
out = ssh("curl -s http://localhost:3001/api/v1/core/banners")
print("banners:", out[:100])
out = ssh("curl -s http://localhost:3001/api/v1/admin/service-providers -H 'Authorization: Bearer badtoken'")
print("sp-admin test:", out[:200])
print("tail log:")
print(ssh("tail -20 /tmp/backend.log"))
