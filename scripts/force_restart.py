#!/usr/bin/env python3
import subprocess, time

HOST = 'cw@192.168.110.50'
def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', HOST, cmd],
                       capture_output=True, text=True)
    print('OUT:', r.stdout[:500])
    if r.stderr: print('ERR:', r.stderr[:300])
    return r.stdout

# Kill all node processes on port 3001
print("=== Kill old processes ===")
ssh("fuser -k 3001/tcp 2>/dev/null; pkill -9 -f 'node src' 2>/dev/null; echo done")
time.sleep(3)

print("=== Start backend ===")
ssh("cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 &")
time.sleep(6)

print("=== Test ===")
out = ssh("curl -s http://localhost:3001/api/v1/core/banners | head -c 80")
print("banners:", out)
out = ssh("curl -s http://localhost:3001/api/v1/admin/service-providers")
print("sp-admin:", out[:200])
print("=== Log ===")
ssh("tail -10 /tmp/backend.log")
