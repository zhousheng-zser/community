#!/usr/bin/env python3
"""Test the bundle order endpoint and diagnose the issue."""
import subprocess, json

HOST = 'cw@192.168.110.50'

def ssh(cmd):
    r = subprocess.run(
        ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
        capture_output=True, text=True, encoding='utf-8', errors='replace'
    )
    print(r.stdout[:600])
    return r.stdout

script = r"""
import pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', db='community', charset='utf8mb4')
cur = conn.cursor()

# Check user 65 (test user)
cur.execute("SELECT id, nickname, phone, community_id FROM Users WHERE id=65")
row = cur.fetchone()
print("User 65:", row)

# Check service providers with id=1
cur.execute("SELECT id, shop_name, user_id, community_id, status FROM service_provider_profiles WHERE id=1")
row = cur.fetchone()
print("Profile id=1:", row)

# Check services for profile 1
cur.execute("SELECT id, title, is_published, provider_id FROM Services WHERE provider_id=1 LIMIT 5")
rows = cur.fetchall()
print("Services for provider 1:", rows)

# Check profiles 6-10
cur.execute("SELECT id, shop_name, user_id, community_id, status FROM service_provider_profiles WHERE id IN (6,7,8,9,10)")
rows = cur.fetchall()
print("Profiles 6-10:", rows)
conn.close()
"""

ssh(f"python3 << 'PYEOF'\n{script}\nPYEOF")

# Also test the actual bundle endpoint with a token
# First get a valid token for user 65
print("\n=== Test bundle endpoint ===")
ssh("echo '{\"phone\":\"13800000000\",\"password\":\"123456\"}' > /tmp/login.json")
out = ssh("curl -sk -X POST https://localhost:3001/api/v1/auth/login_password -H 'Content-Type: application/json' --data @/tmp/login.json")
try:
    data = json.loads(out.split('\n')[0] if '\n' in out else out)
    token = data.get('token') or (data.get('data') or {}).get('token', '')
    print("Token:", token[:40] if token else 'NOT FOUND', '...')
except:
    print("Could not parse token from:", out[:200])
    token = ''

if token:
    body = json.dumps({
        "provider_id": 1,
        "items": [{"service_id": 1, "qty": 1, "title": "test"}],
        "address": "测试地址",
        "contact_name": "测试用户",
        "contact_phone": "13800000000"
    })
    with open('/tmp/bundle_body.json', 'w') as f:
        f.write(body)
    # Upload and test
    import subprocess as sp
    r = sp.run(['scp', '-o', 'BatchMode=yes', HOST + ':/tmp/bundle_body.json', '/tmp/bundle_body_remote.json'],
               capture_output=True)
    ssh(f"echo '{body}' > /tmp/bundle_req.json; curl -sk -X POST https://localhost:3001/api/v1/service-orders/bundle -H 'Content-Type: application/json' -H 'Authorization: Bearer {token}' --data @/tmp/bundle_req.json")
