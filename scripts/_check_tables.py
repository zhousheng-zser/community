import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('120.27.239.244', port=22, username='root', password='cW123456', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, label=''):
    if label: print(f'\n--- {label} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8','replace').strip()
    err = stderr.read().decode('utf-8','replace').strip()
    if out: print(out)
    if err: print('ERR:', err[:500])
    return out

run("mysql -uroot -pCommunityPwd123! community_db -e 'SHOW TABLES LIKE \"coupon%\";'", 'coupon tables')
run("mysql -uroot -pCommunityPwd123! community_db -e 'DESCRIBE coupon_templates;'", 'coupon_templates schema')
run("mysql -uroot -pCommunityPwd123! community_db -e 'SHOW TABLES LIKE \"community_steward%\";'", 'steward tables')

# Fix: add code column if missing, then insert welcome coupon
fix_sql = """
ALTER TABLE coupon_templates ADD COLUMN IF NOT EXISTS code VARCHAR(64) NOT NULL DEFAULT '' COMMENT '模板编码' AFTER id;
ALTER TABLE coupon_templates ADD UNIQUE KEY uk_code (code);
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,total_count,valid_from,valid_to,status)
SELECT 'WELCOME_100_10','满100减10新人券','amount',10.00,100.00,0,NOW(),DATE_ADD(NOW(),INTERVAL 365 DAY),'active'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='WELCOME_100_10' LIMIT 1);
"""
run(f"mysql -uroot -pCommunityPwd123! community_db -e \"{fix_sql}\" 2>&1", 'fix coupon code column')
run("mysql -uroot -pCommunityPwd123! community_db -e 'SELECT id,code,name,discount_amount,threshold_amount FROM coupon_templates;'", 'coupon_templates data')
run("mysql -uroot -pCommunityPwd123! community_db -e 'SHOW TABLES LIKE \"community_steward%\";'", 'steward tables check')

client.close()
print('\nDone.')
