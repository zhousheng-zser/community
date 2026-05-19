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

# Check what route handles /user/profile
pr('=== User routes ===')
out = run("grep -n 'profile\\|getProfile' /root/community-backend/backend/src/modules/user/routes.js")
pr(out)

# Check if there's another user route in the main routes
pr('\n=== Main routes user ===')
out = run("grep -rn '/user/profile\\|userController.*profile\\|getProfile' /root/community-backend/backend/src/routes/ 2>/dev/null | head -10")
pr(out)

# Check index.js route mounting
pr('\n=== Index.js route mounting (user) ===')
out = run("grep -n 'user\\|User' /root/community-backend/backend/src/index.js | head -20")
pr(out)

# Check env file for DEBUG_SKIP_AUTH
pr('\n=== .env DEBUG settings ===')
out = run("grep -i 'debug\\|skip_auth\\|DEFAULT_USER' /root/community-backend/backend/.env 2>/dev/null")
pr(out)

# Get the full profile response with proper JWT - generate one for user 65
pr('\n=== Generate JWT and test ===')
jwt_script = """
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const token = jwt.sign({ id: 65, user_id: 65, openid: 'or0Vf3YhqosKCHtWext5mg6-Ncp8' }, secret, { expiresIn: '1h' });
console.log(token);
"""
out = run(f"cd /root/community-backend/backend && node -e \"{jwt_script}\" 2>&1")
token = out.strip().split('\n')[-1]
pr(f'  Token: {token[:50]}...')

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/user/profile' -H 'Authorization: Bearer {token}'")
pr(f'\n=== Profile with JWT (user 65) ===')
pr(out[:800] if out else '(empty)')

s.close()
