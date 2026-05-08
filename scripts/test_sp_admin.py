#!/usr/bin/env python3
import subprocess

HOST = 'cw@192.168.110.50'
def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True)
    print('OUT:', r.stdout[:600])
    return r.stdout

# First get admin token
print("=== Getting admin token ===")
out = ssh("curl -s -X POST http://localhost:3001/api/v1/auth/login_password -H 'Content-Type: application/json' -d '{\"phone\":\"admin\",\"password\":\"admin123\"}'")

# Try to get token from the admin login
print("=== Test new SP admin route ===")
# Try with any request first to see if route exists (will get 401 not 404)
out = ssh("curl -s http://localhost:3001/api/v1/admin/service-providers")
print("response:", out[:300])

print("=== Check process ===")
ssh("ps aux | grep 'node src' | grep -v grep | head -5")

print("=== Check if new code loaded ===")
out = ssh("grep -c 'listServiceProviders' /home/cw/a/community-backend/backend/src/controllers/adminMarketController.js")
print("listServiceProviders count:", out.strip())
out = ssh("grep -c 'listServiceProviders' /home/cw/a/community-backend/backend/src/routes/adminRoutes.js")
print("routes count:", out.strip())
