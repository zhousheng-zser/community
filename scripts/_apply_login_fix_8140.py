import paramiko, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, t=30):
    print('>>>', cmd[:80])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    if out: print(out[:2000])
    if err: print('ERR', err[:400])
    return out

# Fix User model table name
run("""python3 << 'PY'
p='/root/community-backend/backend/src/models/user.js'
t=open(p).read()
if "tableName: 'Users'" in t:
    t=t.replace("tableName: 'Users'", "tableName: 'users'")
    open(p,'w').write(t)
    print('fixed Users -> users')
else:
    print('already fixed or different:', [l for l in t.splitlines() if 'tableName' in l][:3])
PY""")

# verify query works
run("cd /root/community-backend/backend && node -e \"const db=require('./src/models'); db.User.findOne({where:{phone:'13800000000'}}).then(u=>console.log('ok',u&&u.id)).catch(e=>console.error(e.message))\" 2>&1")

# restart node on 3002 (baota / manual)
run('ps aux | grep 3002 | grep node | head -3')
run('kill $(ss -tlnp | grep 3002 | grep -oP \"pid=\\K[0-9]+\") 2>/dev/null; sleep 2; cd /root/community-backend/backend && nohup node src/index.js >> /tmp/community-backend.log 2>&1 & sleep 3; ss -tlnp | grep 3002')

time.sleep(2)
run("curl -sk -X POST https://jshsp1.eds-tech.cn/api/v1/auth/login_password -H 'Content-Type: application/json' -d '{\"phone\":\"13800000000\",\"password\":\"123456\"}'")

c.close()
print('done')
