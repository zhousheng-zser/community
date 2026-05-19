import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules', timeout=15)
print('API:', o.read().decode())
_, o2, _ = c.exec_command(
    'MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e '
    '"SELECT id,group_key,title,icon_url,is_active FROM service_home_modules ORDER BY sort_order LIMIT 15"',
    timeout=15
)
print('DB:', o2.read().decode())
c.close()
