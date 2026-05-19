import paramiko, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sql = open(os.path.join(os.path.dirname(__file__), '..', 'backend', 'sql', '0433_welcome_coupon_100_20.sql'), encoding='utf-8').read()
extra = (
    "UPDATE coupon_templates SET code='WELCOME_100_20', discount_amount=20.00, threshold_amount=100.00 "
    "WHERE code='WELCOME_100_10';\n"
)
_, so, _ = c.exec_command('cat > /tmp/fix_coupon.sql', timeout=5)
so.channel.send((sql + extra).encode('utf-8'))
so.channel.shutdown_write()
so.read()
_, o, _ = c.exec_command('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/fix_coupon.sql 2>&1', timeout=15)
print(o.read().decode('utf-8', 'replace'))
_, o, _ = c.exec_command('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db -e "SELECT code,name,discount_amount,threshold_amount FROM coupon_templates;" 2>&1', timeout=15)
print(o.read().decode('utf-8', 'replace'))
c.close()
