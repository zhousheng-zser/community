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
    if err: print('ERR:', err[:400])
    return out

# 1. Fix created_at/updated_at to have defaults
run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;\"", '修复时间列默认值')

# 2. Set unique codes for existing rows that have empty code
run("mysql -uroot -pCommunityPwd123! community_db -e \"UPDATE coupon_templates SET code=CONCAT('LEGACY_',id) WHERE code='';\"", '给历史数据设置code')

# 3. Add unique index (drop first if exists)
run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates DROP INDEX uk_code;\" 2>&1 || echo 'no index to drop'", '删除旧索引')
run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates ADD UNIQUE KEY uk_code (code);\"", '添加unique索引')

# 4. Fix status column to be VARCHAR (not enum) to match our code
run("mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE coupon_templates MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';\"", '修复status列类型')

# 5. Insert welcome coupon
run("mysql -uroot -pCommunityPwd123! community_db -e \"INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,total_count,valid_from,valid_to,status) SELECT 'WELCOME_100_10','满100减10新人券','amount',10.00,100.00,0,NOW(),DATE_ADD(NOW(),INTERVAL 365 DAY),'active' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='WELCOME_100_10' LIMIT 1);\"", '插入新人券')

# 6. Verify
run("mysql -uroot -pCommunityPwd123! community_db -e \"SELECT id,code,name,discount_amount,threshold_amount,status FROM coupon_templates;\"", '最终数据验证')

# 7. Also fix coupon_issues if needed
run("mysql -uroot -pCommunityPwd123! community_db -e \"DESCRIBE coupon_issues;\"", 'coupon_issues结构')

client.close()
print('\nAll done.')
