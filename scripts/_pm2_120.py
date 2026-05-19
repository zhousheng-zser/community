import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
cmd = '''
cd /root/community-backend/backend
pm2 list 2>/dev/null
pm2 restart community-benefit-api 2>/dev/null || pm2 restart ecosystem.benefit.pm2 2>/dev/null || pm2 start src/index.js --name community-benefit-api
sleep 4
pm2 list
ss -lntp | grep 3002
'''
_, o, e = c.exec_command(cmd, timeout=50)
text = o.read().decode('utf-8', 'replace') + e.read().decode('utf-8', 'replace')
open(r'd:\CODE\project\community\scripts\_deploy_120_out.txt', 'w', encoding='utf-8').write(text)
c.close()
