#!/usr/bin/env python3
"""强制清理端口并重启后端"""
import subprocess, time

HOST = 'cw@192.168.110.50'

def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    out = r.stdout + r.stderr
    if out.strip(): print(out[:400])
    return out

# Kill all node src/index processes
ssh("pkill -9 -f 'node src/index' 2>/dev/null; echo done")
time.sleep(2)

# Kill anything on port 3001 and 3002
ssh("fuser -k 3001/tcp 2>/dev/null; fuser -k 3002/tcp 2>/dev/null; echo freed")
time.sleep(2)

# Start backend
ssh("cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 & echo started")
time.sleep(5)

# Check
out = ssh("tail -5 /tmp/backend.log")
if 'HTTPS Server' in out:
    print("\n=== 后端启动成功 ===")
elif 'EADDRINUSE' in out:
    print("\n=== 端口仍占用，检查谁在占用 ===")
    ssh("ss -tlnp | grep -E '3001|3002'")
else:
    print("\n=== 状态不明 ===")

# Test API
out = ssh("curl -sk --max-time 5 https://localhost:3001/api/v1/core/service-providers/65")
print("API test:", out[:200])
