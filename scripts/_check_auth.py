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

# Check auth middleware
pr('=== Auth middleware ===')
out = run("cat /root/community-backend/backend/src/middlewares/authMiddleware.js 2>/dev/null")
if not out.strip():
    out = run("find /root/community-backend/backend/src -name '*auth*' -type f 2>/dev/null")
    pr(f'  Auth files: {out}')
    for f in out.strip().split('\n'):
        f = f.strip()
        if f and '.js' in f:
            pr(f'\n  === {f} ===')
            content = run(f"cat '{f}'")
            pr(content[:500])
else:
    pr(out[:1000])

# Check user controller getProfile - how userId is determined
pr('\n=== User controller getProfile ===')
out = run("grep -B10 -A30 'getProfile\\|async.*profile' /root/community-backend/backend/src/modules/user/controllers/user.controller.js | head -60")
pr(out)

# Quick test with the user openid (user 65)
pr('\n=== Test with user 65 openid header ===')
out = run("curl -s 'http://127.0.0.1:3002/api/v1/user/profile' -H 'x-wx-openid: or0Vf3YhqosKCHtWext5mg6-Ncp8'")
pr(out[:500] if out else '(empty)')

s.close()
