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

# Check backend logs
pr('=== Recent backend logs ===')
out = run("tail -50 /root/community-backend/backend/nohup.out 2>/dev/null || tail -50 /root/community-backend/nohup.out 2>/dev/null")
pr(out[-2000:] if out else '(no logs)')

# Check if process is still alive
pr('\n=== Process status ===')
out = run("ps aux | grep 'node.*index' | grep -v grep")
pr(out)

# Kill and restart
pr('\n=== Restarting backend ===')
run("kill 332430 2>/dev/null")
time.sleep(2)

# Start fresh
out = run("cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 & echo $!")
pr(f'  New PID: {out.strip()}')
time.sleep(3)

# Check logs
pr('\n=== Startup logs ===')
out = run("tail -20 /root/community-backend/backend/nohup.out")
pr(out)

# Test API
pr('\n=== Test API ===')
out = run("curl -s http://127.0.0.1:3001/api/v1/user/profile -H 'x-user-id: 65'")
pr(out[:500] if out else '(empty)')

s.close()
