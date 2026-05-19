import paramiko, sys, io

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

# Check the old userController (routes/userRoutes.js controller)
pr('=== Old userRoutes.js ===')
out = run("cat /root/community-backend/backend/src/routes/userRoutes.js")
pr(out[:500])

pr('\n=== Old userController.js ===')
out = run("cat /root/community-backend/backend/src/controllers/userController.js")
pr(out[:2000])

s.close()
