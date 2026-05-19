import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, e = c.exec_command(
    "MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e \"ALTER TABLE posts ADD COLUMN community_id BIGINT NULL;\" 2>&1",
    timeout=15
)
out = o.read().decode() + e.read().decode()
print('alter result:', repr(out))
_, o2, _ = c.exec_command('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "DESCRIBE posts"', timeout=10)
print(o2.read().decode())
_, o3, _ = c.exec_command('curl -s "http://127.0.0.1:3002/api/v1/posts?category=%E7%83%AD%E9%97%A8%E8%AF%9D%E9%A2%98&community_id=1&limit=1"', timeout=10)
print('api:', o3.read().decode()[:200])
c.close()
