import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=20)
    return (o.read() + e.read()).decode('utf-8', 'replace')
print(run('tail -40 /root/community-backend/backend/nohup.out'))
print('--- tables ---')
print(run("MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e \"SHOW TABLES LIKE '%post%'\" 2>&1"))
print(run("MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e 'DESCRIBE posts' 2>&1"))
print(run("MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e 'SHOW TABLES LIKE \"%comment%\"' 2>&1"))
print(run("MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e 'SHOW TABLES LIKE \"%like%\"' 2>&1"))
