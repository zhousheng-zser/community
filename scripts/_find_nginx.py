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

# Find nginx config for market-portal
pr('=== Nginx config ===')
out = run("cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null")
pr(out[:3000])

pr('\n=== Find market dist ===')
out = run("find / -type d -name 'market-applications' 2>/dev/null | head -5")
pr(out)

out = run("find / -type d -name 'dist' -path '*market*' 2>/dev/null | head -5")
pr(out)

# Check the nginx config file directly
pr('\n=== Nginx main config ===')
out = run("grep -r 'market' /etc/nginx/ 2>/dev/null | head -20")
pr(out)

s.close()
