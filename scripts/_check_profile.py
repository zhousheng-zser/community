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

# Check getProfile in user controller - does it return points?
pr('=== user.controller.js getProfile - points ===')
out = run("grep -n -A5 'points' /root/community-backend/backend/src/modules/user/controllers/user.controller.js | head -30")
pr(out)

# Check the User model to see if points is defined
pr('\n=== User model - points attribute ===')
out = run("grep -n 'points' /root/community-backend/backend/src/models/User.js 2>/dev/null || grep -rn 'points' /root/community-backend/backend/src/modules/user/models/ 2>/dev/null | head -10")
pr(out)

# Also check - now that col exists, does User model need defining?
pr('\n=== models/index.js - model load ===')
out = run("grep -n 'User' /root/community-backend/backend/src/models/index.js | head -10")
pr(out)

# Quick API test
pr('\n=== API test: /api/v1/user/profile (user 65) ===')
out = run("curl -s http://localhost:3001/api/v1/user/profile -H 'x-user-id: 65' 2>&1 | head -20")
pr(out)

s.close()
