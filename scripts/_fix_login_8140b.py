import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    'ss -tlnp | grep 3002',
    'cat /www/server/panel/vhost/nginx/node_community-backend.conf | head -40',
    'tail -30 /www/wwwlogs/community-backend.log 2>/dev/null || tail -30 /root/.pm2/logs/*.log 2>/dev/null | tail -30',
    "cd /root/community-backend/backend && node -e \"const db=require('./src/models'); db.User.findOne({where:{phone:'13800000000'}}).then(u=>console.log('user',u&&u.id,u&&u.phone)).catch(e=>console.error('ERR',e.message,e.stack))\" 2>&1",
]
for cmd in cmds:
    print('>>>', cmd[:70])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    print(stdout.read().decode('utf-8', 'replace')[:2500])
    print()
c.close()
