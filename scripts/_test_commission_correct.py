import paramiko, sys

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

# Use the CORRECT JWT_SECRET from server .env
jwt_gen = "const jwt=require('jsonwebtoken');const secret=process.env.JWT_SECRET||'jwt_key_cwsgwbd';console.log(jwt.sign({id:65,user_id:65,openid:'or0Vf3YhqosKCHtWext5mg6-Ncp8'},secret,{expiresIn:'7d'}));"
token = run(f"cd /root/community-backend/backend && node -e \"{jwt_gen}\"").strip().split('\n')[-1]
pr(f'Token (first 50): {token[:50]}...')

# Test with correct token
pr('\n=== commission/my ===')
out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/my' -H 'Authorization: Bearer {token}'")
pr(out)

pr('\n=== commission/my/records ===')
out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/my/records' -H 'Authorization: Bearer {token}'")
pr(out)

pr('\n=== partner/me ===')
out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/partner/me' -H 'Authorization: Bearer {token}'")
pr(out)

pr('\n=== commission/partner-chain ===')
out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/partner-chain' -H 'Authorization: Bearer {token}'")
pr(out)

pr('\n=== commission/config ===')
out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/commission/config'")
pr(out)

s.close()
