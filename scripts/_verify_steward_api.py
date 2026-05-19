import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, o, _ = c.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace').strip()

# 无 token -> 401
print('no auth:', run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/v1/steward/applications'))

# admin login
login = run('curl -s -X POST http://127.0.0.1:3002/api/v1/auth/admin/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\'')
print('login:', login[:200])
try:
    data = json.loads(login)
    token = (data.get('data') or {}).get('token') or data.get('token')
except Exception:
    token = None

if token:
    apps = run(f'curl -s "http://127.0.0.1:3002/api/v1/steward/applications?status=pending&page=1&pageSize=5" -H "Authorization: Bearer {token}"')
    print('applications:', apps[:400])
else:
    # try DEBUG mode login without password
    login2 = run('curl -s -X POST http://127.0.0.1:3002/api/v1/auth/admin/login -H "Content-Type: application/json" -d \'{"username":"admin"}\'')
    print('login2:', login2[:300])

print('apply tables count:', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -N -e "SELECT COUNT(*) FROM community_steward_applications;" 2>&1'))
c.close()
