import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd):
    print('>>>', cmd[:75])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=25)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    if out: print(out[:2000])
    if err: print('ERR', err[:500])
    return out

run('pm2 list --no-color')
run("curl -s -X POST http://127.0.0.1:3002/api/v1/auth/login_password -H 'Content-Type: application/json' -d '{\"phone\":\"13800000000\",\"password\":\"123456\"}'")
run('pm2 logs --lines 25 --nostream 2>&1 | tail -30')
run('test -f /root/community-backend/backend/src/controllers/authController.js && wc -l /root/community-backend/backend/src/controllers/authController.js')
run("grep -n loginPassword /root/community-backend/backend/src/controllers/authController.js | head -3")

c.close()
