#!/usr/bin/env python3
import subprocess, json

HOST = 'cw@192.168.110.50'

def ssh(cmd):
    r = subprocess.run(
        ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
        capture_output=True, text=True, encoding='utf-8', errors='replace'
    )
    print(r.stdout[:800])
    return r.stdout

# Check DB data
db_script = """
import pymysql
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', db='community', charset='utf8mb4')
cur = conn.cursor()
cur.execute('SELECT id, nickname, phone, community_id FROM Users WHERE id=65')
print('User65:', cur.fetchone())
cur.execute('SELECT id, shop_name, user_id, community_id, status FROM service_provider_profiles WHERE id=1')
print('Profile1:', cur.fetchone())
cur.execute('SELECT id, title, is_published, provider_id FROM Services WHERE provider_id=1 LIMIT 5')
print('Services1:', cur.fetchall())
# Check if Services table even has these records
cur.execute('SELECT COUNT(*) FROM Services WHERE provider_id IS NOT NULL')
print('Services with provider_id:', cur.fetchone())
# Check what profiles exist and their services
cur.execute('SELECT p.id, p.shop_name, p.community_id, p.status, COUNT(s.id) as svc_cnt FROM service_provider_profiles p LEFT JOIN Services s ON s.provider_id=p.id GROUP BY p.id LIMIT 15')
print('Profile summary:', cur.fetchall())
conn.close()
"""
print("=== DB State ===")
ssh(f"python3 << 'PYEOF'\n{db_script}\nPYEOF")

# Get a token via wx_login code bypass (DEBUG mode)
print("\n=== Try login with DEBUG_SKIP ===")
out = ssh("grep 'DEBUG_SKIP\|SKIP_AUTH\|debug' /home/cw/a/community-backend/backend/.env | head -5")

# Try login_password with test credentials
print("\n=== Try various login methods ===")
ssh("python3 -c \"import json; open('/tmp/l1.json','w').write(json.dumps({'phone':'13800000000','password':'123456'}))\"")
out = ssh("curl -sk -X POST https://localhost:3001/api/v1/auth/login_password -H 'Content-Type: application/json' -d @/tmp/l1.json")
print("login attempt:", out[:300])
