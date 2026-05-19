import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)
cmd = '''
curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg
echo
pm2 logs community-benefit-api --lines 8 --nostream 2>&1 | tail -12
mysql -uroot -pCommunityPwd123! community_db -e "SELECT id,name,group_type FROM categories WHERE group_type='gfg' LIMIT 5" 2>/dev/null
'''
_, o, e = c.exec_command(cmd, timeout=30)
open(r'd:\CODE\project\community\scripts\_restart_out.txt', 'w', encoding='utf-8').write(o.read().decode('utf-8', 'replace'))
c.close()
