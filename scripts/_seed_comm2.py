import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
cmd = """MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "
INSERT INTO communities (name, address, status, created_at, updated_at) VALUES
('阳光社区', '杭州市西湖区阳光路1号', 'active', NOW(), NOW()),
('测试社区A', 'E2E测试', 'active', NOW(), NOW());
SELECT id,name,status FROM communities;
" 2>&1"""
_, o, _ = c.exec_command(cmd, timeout=15)
print(o.read().decode())
c.close()
