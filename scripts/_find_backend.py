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

# Check nginx config to find what port the app uses
pr('=== Nginx backend proxy config ===')
out = run("grep -r 'proxy_pass\\|upstream' /etc/nginx/sites-enabled/ 2>/dev/null || grep -r 'proxy_pass\\|upstream' /etc/nginx/conf.d/ 2>/dev/null | head -20")
pr(out)

# Check ALL node processes
pr('\n=== All node processes ===')
out = run("ps aux | grep node | grep -v grep")
pr(out)

# Check which process is on port 3001
pr('\n=== Port 3001 ===')
out = run("ss -tlnp | grep 3001")
pr(out)

pr('\n=== Port 3000 ===')
out = run("ss -tlnp | grep 3000")
pr(out)

pr('\n=== Port 3002 ===')
out = run("ss -tlnp | grep 3002")
pr(out)

# Check the /home/cw/a backend - is that the real one?
pr('\n=== /home/cw/a/community-backend/backend/src/index.js - what port? ===')
out = run("grep -n 'listen\\|PORT' /home/cw/a/community-backend/backend/src/index.js | head -10")
pr(out)

# Check /root version
pr('\n=== /root/community-backend/backend/src/index.js - what port? ===')
out = run("grep -n 'listen\\|PORT' /root/community-backend/backend/src/index.js | head -10")
pr(out)

# Test both ports
pr('\n=== Test port 3000 ===')
out = run("curl -s http://127.0.0.1:3000/api/v1/user/profile -H 'x-user-id: 65' 2>&1")
pr(out[:300] if out else '(empty)')

pr('\n=== Test port 3002 ===')
out = run("curl -s http://127.0.0.1:3002/api/v1/user/profile -H 'x-user-id: 65' 2>&1")
pr(out[:300] if out else '(empty)')

s.close()
