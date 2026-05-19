import paramiko, sys, time, io

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

# Find the merchant portal routes file on server
pr('=== Find merchant portal routes ===')
out = run("find /root/community-backend -name 'merchantPortalRoutes*' -o -name '*merchant*route*' 2>/dev/null | grep -v node_modules")
pr(out)

# Check current complete-delivery route
pr('\n=== Current complete-delivery route ===')
out = run("grep -n 'complete-delivery\\|complete_delivery\\|delivered' /root/community-backend/backend/src/routes/merchantPortalRoutes.js 2>/dev/null")
pr(out)

s.close()
