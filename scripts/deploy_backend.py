import paramiko, sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=60):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    sys.stdout.buffer.write(('>>> ' + cmd[:120] + '\n').encode('utf-8'))
    sys.stdout.buffer.write((out + err).encode('utf-8', 'replace'))
    sys.stdout.buffer.write(b'\n')
    sys.stdout.buffer.flush()
    return out + err

BACKEND = '/root/community-backend/backend'

# Pull latest code
run(f'cd {BACKEND} && git pull origin feature/master 2>&1', 120)

# Restart backend
run('pm2 restart community-backend 2>&1 || pm2 start /root/community-backend/backend/src/app.js --name community-backend 2>&1')

# Check status
run('pm2 list 2>&1')

s.close()
print("Deploy done")
