import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
cmds = [
    'grep -n admin /root/community-backend/backend/src/index.js',
    'cat /root/community-backend/backend/src/routes/adminRoutes.js',
    'grep worker_user_id /root/community-backend/backend/src/models/ServiceOrder.js /root/community-backend/backend/src/controllers/adminDispatchController.js 2>/dev/null',
]
out = []
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=25)
    out.append('=== ' + cmd + '\n' + o.read().decode('utf-8', 'replace'))
open(r'd:\CODE\project\community\scripts\_120_out.txt', 'w', encoding='utf-8').write('\n'.join(out))
c.close()
