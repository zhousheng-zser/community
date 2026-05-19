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

# Check backend port
pr('=== Backend process ===')
out = run("ps aux | grep 'node.*index.js' | grep -v grep")
pr(out)

# Test API
pr('\n=== Test profile API (port 3001) ===')
out = run("curl -s http://127.0.0.1:3001/api/v1/user/profile -H 'x-user-id: 65' -H 'authorization: Bearer test'")
pr(out[:600] if out else '(empty - trying other ports)')

if not out.strip():
    pr('\n=== Try port 3000 ===')
    out = run("curl -s http://127.0.0.1:3000/api/v1/user/profile -H 'x-user-id: 65'")
    pr(out[:600] if out else '(empty)')

# Check how auth middleware works - maybe need openid
pr('\n=== Check auth middleware ===')
out = run("grep -n 'x-user-id\\|openid\\|userId\\|user_id' /root/community-backend/backend/src/middlewares/auth*.js 2>/dev/null || grep -rn 'x-user-id\\|req.userId' /root/community-backend/backend/src/middlewares/ 2>/dev/null | head -10")
pr(out)

# Try with openid
pr('\n=== Try with x-openid header ===')
out = run("curl -s http://127.0.0.1:3001/api/v1/user/profile -H 'x-openid: or0Vf3YhqosKCHtWext5mg6-Ncp8'")
pr(out[:600] if out else '(empty)')

s.close()
