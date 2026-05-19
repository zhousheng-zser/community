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

# Check what port the server is actually listening on
pr('=== Listening ports ===')
out = run("ss -tlnp | grep node")
pr(out)

# Check the auth middleware
pr('\n=== Auth middleware content ===')
out = run("cat /root/community-backend/backend/src/middlewares/auth.js 2>/dev/null || cat /root/community-backend/backend/src/middleware/auth.js 2>/dev/null")
pr(out[:1000])

# Test with full verbose curl
pr('\n=== curl verbose test ===')
out = run("curl -v http://127.0.0.1:3001/api/v1/user/profile -H 'x-user-id: 65' 2>&1")
pr(out[:800])

s.close()
