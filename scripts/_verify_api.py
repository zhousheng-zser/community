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

# Check if backend is running
out = run("pgrep -f 'node src/index.js'")
pr(f'Backend PIDs: {out.strip()}')

if not out.strip():
    pr('Starting backend...')
    run("cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 &")
    time.sleep(5)
    out = run("pgrep -f 'node src/index.js'")
    pr(f'New PID: {out.strip()}')

# Check startup
out = run("tail -5 /root/community-backend/backend/nohup.out")
pr(f'Logs: {out}')

# Test with JWT
jwt_gen = "const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:65,user_id:65},'your-jwt-secret-key-change-in-production',{expiresIn:'1h'}));"
token = run(f"cd /root/community-backend/backend && node -e \"{jwt_gen}\"").strip().split('\n')[-1]

out = run(f"curl -s 'http://127.0.0.1:3002/api/v1/user/profile' -H 'Authorization: Bearer {token}'")
pr(f'\n=== User 65 Profile ===\n{out[:600]}')

s.close()
