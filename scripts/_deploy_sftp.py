"""
Deploy changed backend files to 120.27.239.244 via SFTP.
"""
import paramiko
import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
USER = 'root'
PASSWORD = 'cW123456'
LOCAL_BACKEND = r'd:\CODE\project\community\backend'
REMOTE_BACKEND = '/root/community-backend/backend'

# Files/dirs to upload (relative to backend/)
TARGETS = [
    'src/modules/steward',
    'src/modules/coupon',
    'src/modules/mini-program/controllers/miniProgram.controller.js',
    'src/modules/user/controllers/user.controller.js',
    'src/modules/service-order/controllers/serviceOrder.controller.js',
    'src/modules/market/controllers/market.controller.js',
    'src/routes/index.js',
    'sql/0430_community_steward.sql',
    'sql/0431_coupon_system.sql',
]

def run(client, cmd, label=''):
    if label: print(f'\n>>> {label}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(out[:2000])
    if err and code != 0: print('ERR:', err[:500])
    return code, out

def sftp_mkdir_p(sftp, remote_dir):
    parts = remote_dir.split('/')
    path = ''
    for p in parts:
        if not p:
            path = '/'
            continue
        path = path + '/' + p if path != '/' else '/' + p
        try:
            sftp.stat(path)
        except FileNotFoundError:
            sftp.mkdir(path)

def upload_file(sftp, local_path, remote_path):
    remote_dir = os.path.dirname(remote_path)
    sftp_mkdir_p(sftp, remote_dir)
    sftp.put(local_path, remote_path)
    print(f'  UP: {remote_path}')

def upload_dir(sftp, local_dir, remote_dir):
    sftp_mkdir_p(sftp, remote_dir)
    for item in os.listdir(local_dir):
        local_item = os.path.join(local_dir, item)
        remote_item = remote_dir + '/' + item
        if os.path.isdir(local_item):
            if item in ('node_modules', '.git', '__pycache__'):
                continue
            upload_dir(sftp, local_item, remote_item)
        else:
            upload_file(sftp, local_item, remote_item)

def main():
    print(f'Connecting {USER}@{HOST}...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=22, username=USER, password=PASSWORD,
                   timeout=15, look_for_keys=False, allow_agent=False)
    print('Connected!')

    sftp = client.open_sftp()

    print('\n=== Step 1: Upload files ===')
    for target in TARGETS:
        local = os.path.join(LOCAL_BACKEND, target.replace('/', os.sep))
        remote = REMOTE_BACKEND + '/' + target
        if not os.path.exists(local):
            print(f'  SKIP (not found locally): {local}')
            continue
        if os.path.isdir(local):
            print(f'  DIR: {target}')
            upload_dir(sftp, local, remote)
        else:
            upload_file(sftp, local, remote)

    sftp.close()

    print('\n=== Step 2: SQL migrations ===')
    sql = """
CREATE TABLE IF NOT EXISTS community_steward_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL DEFAULT '',
  gender VARCHAR(10) NULL DEFAULT '',
  community_id BIGINT UNSIGNED NULL,
  community_name VARCHAR(200) NOT NULL DEFAULT '',
  id_card VARCHAR(32) NULL DEFAULT '',
  id_card_url VARCHAR(500) NULL DEFAULT '',
  intro TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500) NULL DEFAULT '',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS community_steward_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  community_id BIGINT UNSIGNED NULL,
  community_name VARCHAR(200) NOT NULL DEFAULT '',
  name VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL DEFAULT '',
  hotline VARCHAR(32) NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  KEY idx_community_id (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS coupon_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL DEFAULT '',
  name VARCHAR(120) NOT NULL DEFAULT '',
  type VARCHAR(20) NOT NULL DEFAULT 'amount',
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_count INT UNSIGNED NOT NULL DEFAULT 0,
  issued_count INT UNSIGNED NOT NULL DEFAULT 0,
  valid_from DATETIME NULL,
  valid_to DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (code),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS coupon_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'unused',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  order_type VARCHAR(32) NULL,
  order_ref VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_status (user_id, status),
  KEY idx_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,total_count,valid_from,valid_to,status)
SELECT 'WELCOME_100_10','满100减10新人券','amount',10.00,100.00,0,NOW(),DATE_ADD(NOW(),INTERVAL 365 DAY),'active'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='WELCOME_100_10' LIMIT 1);
"""
    run(client, f"mysql -uroot -p'CommunityPwd123!' community_db <<'ENDSQL'\n{sql}\nENDSQL", 'SQL迁移')

    print('\n=== Step 3: npm install ===')
    run(client, f'cd {REMOTE_BACKEND} && npm install --production 2>&1 | tail -5', 'npm install')

    print('\n=== Step 4: pm2 start/restart ===')
    # Find ecosystem config
    code, out = run(client, f'ls {REMOTE_BACKEND}/ecosystem* 2>/dev/null', 'ecosystem files')
    if 'ecosystem' in out:
        eco_file = out.strip().split('\n')[0]
        run(client, f'cd {REMOTE_BACKEND} && pm2 start {eco_file} 2>&1 || pm2 restart {eco_file} 2>&1', 'pm2 start')
    else:
        run(client, f'cd {REMOTE_BACKEND} && pm2 start src/app.js --name community-backend 2>&1 || pm2 restart community-backend 2>&1', 'pm2 start')

    import time
    time.sleep(3)
    run(client, 'pm2 list --no-color 2>&1', 'pm2 list')

    print('\n=== Step 5: Health check ===')
    run(client, "curl -sk 'https://127.0.0.1:3001/api/v1/core/communities' 2>&1 | head -c 200 || curl -sk 'http://127.0.0.1:3001/api/v1/core/communities' 2>&1 | head -c 200", '健康检查')

    print('\n=== Deploy complete! ===')
    client.close()

if __name__ == '__main__':
    main()
