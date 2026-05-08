#!/usr/bin/env python3
import subprocess, time

HOST = 'cw@192.168.110.50'
def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True)
    if r.stdout: print('OUT:', r.stdout[:600])
    if r.stderr: print('ERR:', r.stderr[:200])
    return r.stdout

print("=== Check process ===")
out = ssh("ps aux | grep node | grep -v grep")
if not out.strip():
    print("no node process found, starting...")
    ssh("cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 &")
    time.sleep(6)

print("=== Test banners ===")
ssh("curl -s http://localhost:3001/api/v1/core/banners | head -c 100")

print("=== Test new SP admin route (no auth = 401) ===")
ssh("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/v1/admin/service-providers")

print("=== Check model associations ===")
ssh("grep -n 'Service,' /home/cw/a/community-backend/backend/src/models/index.js | head -5")

print("=== Check Service has provider association ===")
ssh("grep -n 'belongsTo\|hasMany\|provider' /home/cw/a/community-backend/backend/src/models/service.js | head -10")
