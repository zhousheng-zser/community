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

# Check nginx config for ancientscrolllibrary.cn
pr('=== Nginx config for jshsp1 ===')
out = run("find /etc/nginx -name '*.conf' -exec grep -l 'jshsp1' {} \\; 2>/dev/null")
pr(out)

for f in out.strip().split('\n'):
    if f.strip():
        pr(f'\n=== {f} ===')
        content = run(f"cat '{f.strip()}'")
        pr(content[:2000])

# Also test externally via HTTPS
pr('\n=== Test via HTTPS (external) ===')
jwt_gen = "const jwt=require('jsonwebtoken');console.log(jwt.sign({id:65,user_id:65,openid:'or0Vf3YhqosKCHtWext5mg6-Ncp8'},'jwt_key_cwsgwbd',{expiresIn:'7d'}));"
token = run(f"cd /root/community-backend/backend && node -e \"{jwt_gen}\"").strip().split('\n')[-1]

out = run(f"curl -sk 'https://ancientscrolllibrary.cn/api/v1/commission/my' -H 'Authorization: Bearer {token}'")
pr(f'commission/my via https: {out[:300]}')

out = run(f"curl -sk 'https://ancientscrolllibrary.cn/api/v1/commission/my/records' -H 'Authorization: Bearer {token}'")
pr(f'\ncommission/my/records via https: {out[:500]}')

out = run(f"curl -sk 'https://ancientscrolllibrary.cn/api/v1/partner/me' -H 'Authorization: Bearer {token}'")
pr(f'\npartner/me via https: {out[:300]}')

s.close()
