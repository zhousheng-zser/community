import paramiko, time, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
REMOTE = '/root/community-backend/backend'
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=12):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 & echo started', t=5)
time.sleep(4)
print('proc:', run('pgrep -af "node src/index.js"'))
c.close()
