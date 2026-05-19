import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('120.27.239.244', port=22, username='root', password='cW123456', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, label='', ignore_err=False):
    if label: print(f'\n--- {label} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=20)
    out = stdout.read().decode('utf-8','replace').strip()
    err = stderr.read().decode('utf-8','replace').strip()
    if out: print(out)
    if err and not ignore_err: print('ERR:', err[:300])
    return out

def col_exists(table, col):
    out = run(f"mysql -uroot -pCommunityPwd123! community_db -e \"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='community_db' AND TABLE_NAME='{table}' AND COLUMN_NAME='{col}';\" 2>/dev/null")
    return '0' not in out.split('\n')[-1]

# Fix coupon_issues
table = 'coupon_issues'

if not col_exists(table, 'order_type'):
    run(f"mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE {table} ADD COLUMN order_type VARCHAR(32) NULL AFTER used_at;\"", 'ADD order_type')
else:
    print('order_type already exists')

if not col_exists(table, 'order_ref'):
    run(f"mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE {table} ADD COLUMN order_ref VARCHAR(64) NULL AFTER order_type;\"", 'ADD order_ref')
else:
    print('order_ref already exists')

if not col_exists(table, 'updated_at'):
    run(f"mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE {table} ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;\"", 'ADD updated_at')
else:
    print('updated_at already exists')

# Fix other columns
run(f"mysql -uroot -pCommunityPwd123! community_db -e \"ALTER TABLE {table} MODIFY COLUMN user_id BIGINT UNSIGNED NOT NULL, MODIFY COLUMN template_id BIGINT UNSIGNED NOT NULL, MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'unused', MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;\"", '修复列类型')

# Verify final state
run(f"mysql -uroot -pCommunityPwd123! community_db -e \"DESCRIBE {table};\"", '最终结构')

# Check pm2 status
run('pm2 list --no-color', 'pm2状态')
run("curl -sk 'https://127.0.0.1:3001/api/v1/core/communities' | head -c 200", 'API检查')

client.close()
print('\nAll done.')
