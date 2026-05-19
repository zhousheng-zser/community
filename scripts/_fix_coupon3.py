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

# Fix coupon_issues: add missing columns
run("""mysql -uroot -pCommunityPwd123! community_db -e "
ALTER TABLE coupon_issues
  MODIFY COLUMN user_id BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN template_id BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'unused',
  MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(32) NULL AFTER used_at,
  ADD COLUMN IF NOT EXISTS order_ref VARCHAR(64) NULL AFTER order_type,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER order_ref;
" 2>&1""", 'fix coupon_issues columns')

# Verify
run("mysql -uroot -pCommunityPwd123! community_db -e \"DESCRIBE coupon_issues;\"", 'coupon_issues 最终结构')

# Check pm2 / backend logs
run('pm2 list --no-color', 'pm2状态')
run('pm2 logs --lines 20 --no-color 2>&1 | tail -30', 'pm2日志末尾')

# Health check
run("curl -sk 'https://127.0.0.1:3001/api/v1/core/communities' | head -c 300", 'API健康检查')

client.close()
print('\nAll fixed.')
