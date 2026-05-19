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

# Step 1: check if code column exists
result = run("mysql -uroot -pCommunityPwd123! community_db -e \"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='community_db' AND TABLE_NAME='coupon_templates' AND COLUMN_NAME='code';\"", 'code列是否存在')
has_code = '0' not in result or '1' in result.split('\n')[-1]

if '0' in result.split('\n')[-1]:
    print('\n[需要添加code列]')
    run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates ADD COLUMN code VARCHAR(64) NOT NULL DEFAULT '' COMMENT '模板编码' AFTER id;\"", 'ADD code column')
    run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates ADD UNIQUE KEY uk_code (code);\" 2>&1 || echo 'key already exists'", 'ADD unique key')
else:
    print('\n[code列已存在，跳过]')

# Step 2: also ensure type column accepts 'amount' value
run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates MODIFY COLUMN type VARCHAR(20) NOT NULL DEFAULT 'amount';\"", '修改type列为VARCHAR')

# Step 3: insert welcome coupon
run("""mysql -uroot -pCommunityPwd123! community_db -e "INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,total_count,valid_from,valid_to,status) SELECT 'WELCOME_100_10','满100减10新人券','amount',10.00,100.00,0,NOW(),DATE_ADD(NOW(),INTERVAL 365 DAY),'active' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='WELCOME_100_10' LIMIT 1);" """, '插入新人券')

# Step 4: verify
run("mysql -uroot -pCommunityPwd123! community_db -e \"SELECT id,code,name,discount_amount,threshold_amount,status FROM coupon_templates;\"", '验证优惠券数据')
run("mysql -uroot -pCommunityPwd123! community_db -e \"DESCRIBE coupon_templates;\"", '验证表结构')

client.close()
print('\nDone.')
