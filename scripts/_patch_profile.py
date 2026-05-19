import paramiko, sys, io

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=30):
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

# Fix: Add 'points' to the old userController getProfile
pr('=== Patching userController.js ===')
patch_cmd = """sed -i "s/attributes: \\['id', 'openid', 'nickname', 'avatar_url', 'phone', 'address', 'bank_num', 'wx_id', 'role', 'balance'\\]/attributes: ['id', 'openid', 'nickname', 'avatar_url', 'phone', 'address', 'bank_num', 'wx_id', 'role', 'balance', 'points', 'invited_by']/" /root/community-backend/backend/src/controllers/userController.js"""
out = run(patch_cmd)
if out.strip(): pr(f'  sed output: {out}')

# Verify
out = run("grep 'points' /root/community-backend/backend/src/controllers/userController.js")
pr(f'  Verified: {out.strip()}')

# Also need to include points in the JSON response
# The response is: res.json({ ...profile, role: ..., merchant_status: ... })
# Since ...profile already spreads all attributes, points will be included automatically
# Let's verify
pr('\n=== Response includes points via ...profile spread ===')
out = run("grep -A5 'res.json' /root/community-backend/backend/src/controllers/userController.js | head -10")
pr(out)

# Restart backend
pr('\n=== Restarting backend ===')
import time
run("kill $(pgrep -f 'node src/index.js') 2>/dev/null")
time.sleep(2)
run("cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 &")
time.sleep(4)

# Test
pr('\n=== Test profile API ===')
# Generate JWT for user 65
jwt_gen = "const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:65,user_id:65},'your-jwt-secret-key-change-in-production',{expiresIn:'1h'}));"
token = run(f"cd /root/community-backend/backend && node -e \"{jwt_gen}\"").strip().split('\n')[-1]

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/user/profile' -H 'Authorization: Bearer {token}'")
pr(out[:600] if out else '(empty)')

# Also check default debug user
pr('\n=== Test without token (debug mode, user 1) ===')
out = run("curl -s 'http://127.0.0.1:3002/api/v1/user/profile'")
pr(out[:600] if out else '(empty)')

s.close()
pr('\n=== DONE ===')
