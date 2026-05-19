import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmd = '''
cd /root/community-backend/backend
pm2 delete all 2>/dev/null || true
pm2 start src/index.js --name community-benefit-api
sleep 8
pm2 list
ss -lntp | grep -E "3001|3002"
pm2 logs community-benefit-api --lines 30 --nostream 2>&1
curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules | head -c 220
echo
curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg | head -c 220
'''
_, o, e = c.exec_command(cmd, timeout=60)
out = o.read().decode('utf-8', 'replace')
open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'w', encoding='utf-8').write(out)
c.close()
print('done', len(out))
