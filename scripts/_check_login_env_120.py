import paramiko, json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=20)
    return o.read().decode('utf-8', 'replace').strip()

print('=== JWT_SECRET in .env ===')
print(run('grep -E "^JWT_SECRET|^DEBUG_ADMIN|^NODE_ENV" /root/community-backend/backend/.env 2>/dev/null | sed "s/=.*/=***/"'))

print('\n=== users sample ===')
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -N -e \"SELECT id,phone,LEFT(openid,12),nickname FROM users ORDER BY id LIMIT 8\""))

print('\n=== wx mock login two codes ===')
for code in ['test_user_a', 'test_user_b']:
    r = run(f"curl -sk -X POST https://127.0.0.1:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{{\"code\":\"{code}\"}}'")
    print(code, r[:220])

print('\n=== authPassword verifySmsCode ===')
print(run('grep -A5 "function verifySmsCode" /root/community-backend/backend/src/utils/authPassword.js 2>/dev/null || echo missing'))

c.close()
