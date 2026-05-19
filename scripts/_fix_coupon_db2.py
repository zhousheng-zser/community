import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=15)
    out = o.read().decode('utf-8', 'replace')
    err = e.read().decode('utf-8', 'replace')
    return out + err

print('tables:', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SHOW TABLES LIKE \'coupon%\';"'))
print('before:', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SELECT id,code,discount_amount FROM coupon_templates WHERE code=\'WELCOME_100_10\';"'))
print('update:', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "UPDATE coupon_templates SET discount_amount=20, code=\'WELCOME_100_20\' WHERE code=\'WELCOME_100_10\'; SELECT ROW_COUNT();"'))
print('after:', run('MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e "SELECT id,code,discount_amount FROM coupon_templates;"'))
c.close()
