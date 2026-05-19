import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
def run(cmd):
    _, o, _ = c.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace')
print(run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SELECT id,user_id,phone,status FROM community_steward_applications ORDER BY id;" 2>&1'))
print(run('curl -s http://127.0.0.1:3002/api/v1/user/profile -H "Authorization: Bearer $(curl -s -X POST http://127.0.0.1:3002/api/v1/auth/login_sms -H \"Content-Type: application/json\" -d \'{\"phone\":\"15267619061\",\"code\":\"024680\"}\' | python3 -c \"import sys,json; print(json.load(sys.stdin)[\'token\'])\")" 2>&1 | head -c 400'))
c.close()
