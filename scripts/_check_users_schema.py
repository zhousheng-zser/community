import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
def run(cmd):
    _, o, _ = c.exec_command(cmd, timeout=15)
    return o.read().decode('utf-8', 'replace')
print(run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SHOW COLUMNS FROM users;" 2>&1'))
print(run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SELECT id,phone,nickname FROM users LIMIT 5;" 2>&1'))
c.close()
