import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

sql = """
INSERT INTO communities (name, address, status) VALUES
('阳光社区', '杭州市西湖区阳光路1号', 'active'),
('春风社区', '杭州市西湖区春风路2号', 'active'),
('和谐社区', '杭州市西湖区和谐路3号', 'active'),
('测试社区A', 'E2E测试小区', 'active');

UPDATE community_steward_profiles p
INNER JOIN community_steward_applications a ON a.user_id = p.user_id AND a.status = 'approved'
SET p.community_id = COALESCE(p.community_id, a.community_id, 1),
    p.hotline = COALESCE(NULLIF(p.hotline, ''), p.phone, '400-888-0001')
WHERE p.status = 'active';
"""
_, so, _ = c.exec_command('cat > /tmp/seed_comm.sql', timeout=5)
so.channel.send(sql.encode('utf-8'))
so.channel.shutdown_write()
so.read()
_, o, _ = c.exec_command('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db < /tmp/seed_comm.sql 2>&1', timeout=15)
print(o.read().decode())
_, o2, _ = c.exec_command('curl -s http://127.0.0.1:3002/api/v1/geo/communities', timeout=10)
print('geo:', o2.read().decode()[:400])
_, o3, _ = c.exec_command('curl -s "http://127.0.0.1:3002/api/v1/steward/public/info?community_id=1"', timeout=10)
print('steward:', o3.read().decode())
c.close()
