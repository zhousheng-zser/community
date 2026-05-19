import paramiko, sys, time

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=15):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try: out = stdout.read().decode('utf-8', 'ignore')
    except: out = ''
    try: err = stderr.read().decode('utf-8', 'ignore')
    except: err = ''
    return out + err

def pr(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', 'replace'))
    sys.stdout.buffer.flush()

# Check how auth works in production - with real wx login token
pr('=== Backend .env auth settings ===')
out = run("grep -i 'AUTH\\|JWT\\|DEFAULT_USER' /root/community-backend/backend/.env")
pr(out)

# Check if commission routes are mounted
pr('\n=== Check commission routes mounted ===')
out = run("grep -n 'commission\\|partner' /root/community-backend/backend/src/index.js")
pr(out)

# Test commission API with user 65 JWT
pr('\n=== Test commission/my with user 65 ===')
jwt_gen = "const jwt=require('jsonwebtoken');console.log(jwt.sign({id:65,user_id:65},'your-jwt-secret-key-change-in-production',{expiresIn:'1h'}));"
token = run(f"cd /root/community-backend/backend && node -e \"{jwt_gen}\"").strip().split('\n')[-1]

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/my' -H 'Authorization: Bearer {token}'")
pr(f'commission/my: {out[:500]}')

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/my/records' -H 'Authorization: Bearer {token}'")
pr(f'\ncommission/my/records: {out[:500]}')

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/partner/me' -H 'Authorization: Bearer {token}'")
pr(f'\npartner/me: {out[:500]}')

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/partner-chain' -H 'Authorization: Bearer {token}'")
pr(f'\npartner-chain: {out[:500]}')

# Also check without token (debug mode fallback to user 1)
pr('\n\n=== Without token (debug user 1) ===')
out = run("curl -s 'http://127.0.0.1:3002/api/v1/commission/my'")
pr(f'commission/my: {out[:300]}')

# Check commission_distributions table data
pr('\n=== commission_distributions for user 65 ===')
out = run("mysql -u root -pCommunityPwd123! community_db -N -e \"SELECT id, order_id, order_type, beneficiary_user_id, beneficiary_role, commission_amount, status FROM commission_distributions WHERE beneficiary_user_id=65 LIMIT 10;\" 2>/dev/null")
pr(out)

# Check partner_commission_balances
pr('\n=== partner_commission_balances ===')
out = run("mysql -u root -pCommunityPwd123! community_db -N -e \"SELECT * FROM partner_commission_balances WHERE user_id=65;\" 2>/dev/null")
pr(out)

# Check partner_roles for user 65
pr('\n=== partner_roles for user 65 ===')
out = run("mysql -u root -pCommunityPwd123! community_db -N -e \"SELECT * FROM partner_roles WHERE user_id=65;\" 2>/dev/null")
pr(out)

s.close()
