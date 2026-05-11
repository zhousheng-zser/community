import paramiko, sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=120):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    sys.stdout.buffer.write(('>>> ' + cmd[:140] + '\n').encode('utf-8'))
    sys.stdout.buffer.write((out + err).encode('utf-8', 'replace'))
    sys.stdout.buffer.write(b'\n')
    sys.stdout.buffer.flush()
    return out + err

# Check remote origin and change to HTTPS
run('cd /root/community-backend && git remote -v')
run('cd /root/community-backend && git remote set-url origin https://github.com/zhousheng-zser/community.git')
run('cd /root/community-backend && git fetch origin feature/master 2>&1', 60)
run('cd /root/community-backend && git checkout feature/master 2>&1')
run('cd /root/community-backend && git pull origin feature/master 2>&1', 60)

# Restart
run('pm2 restart community-backend 2>&1')
run('sleep 2 && pm2 logs community-backend --lines 10 --nostream 2>&1')

s.close()
print("Done")
