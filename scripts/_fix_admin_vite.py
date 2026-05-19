import paramiko, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', 'replace').strip()
    if out: print(out)
    return stdout.channel.recv_exit_status()

run("""python3 << 'PY'
p='/root/community-backend/admin/vite.config.js'
t=open(p).read()
t=t.replace('open: true', 'open: false')
open(p,'w').write(t)
print('vite open:false')
PY""")
run('pm2 restart community-admin')
time.sleep(4)
run('ss -tlnp | grep 5173')
run('pm2 list --no-color')
c.close()
