"""
Deploy latest backend code and run migrations on the actual production server.
Server: 120.27.239.244  user: cw  password: cW23456
Backend path: /home/cw/a/community-backend/backend
"""
import paramiko
import sys
import time

HOST = '120.27.239.244'
PORT = 22
USER = 'cw'
PASSWORD = 'cW23456'
BACKEND_DIR = '/home/cw/a/community-backend/backend'
DB_USER = 'root'
DB_PASS = 'CommunityPwd123!'
DB_NAME = 'community_db'

SQLS = [
    ('0430_community_steward', """
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
"""),
    ('0431_coupon_system', """
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
INSERT INTO coupon_templates (code, name, type, discount_amount, threshold_amount, total_count, valid_from, valid_to, status)
SELECT 'WELCOME_100_10', '满100减10新人券', 'amount', 10.00, 100.00, 0,
  NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code = 'WELCOME_100_10' LIMIT 1);
"""),
]

def run(client, cmd, desc=''):
    print(f'\n>> {desc or cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print('[stderr]', err)
    print(f'[exit {code}]')
    return code, out, err

def main():
    import os
    home = os.path.expanduser('~')
    key_paths = [
        os.path.join(home, '.ssh', 'id_ed25519'),
        os.path.join(home, '.ssh', 'id_rsa'),
    ]

    def try_connect(host, port, user, password, key_paths):
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # try each key
        for kp in key_paths:
            if not os.path.exists(kp):
                continue
            try:
                print(f'  Trying key {kp} ...')
                c.connect(host, port=port, username=user, key_filename=kp, timeout=12, look_for_keys=False, allow_agent=False)
                print(f'  Key auth OK: {kp}')
                return c
            except Exception as e:
                print(f'  Key {kp} failed: {e}')
        # try password
        try:
            print(f'  Trying password auth...')
            c.connect(host, port=port, username=user, password=password, timeout=12, look_for_keys=False, allow_agent=False)
            print(f'  Password auth OK')
            return c
        except Exception as e:
            print(f'  Password auth failed: {e}')
        return None

    print(f'Connecting to {USER}@{HOST}:{PORT} ...')
    client = try_connect(HOST, PORT, USER, PASSWORD, key_paths)
    if client is None:
        # Try root
        print(f'Trying root@{HOST}:{PORT} ...')
        client = try_connect(HOST, PORT, 'root', PASSWORD, key_paths)
    if client is None:
        print('All connection attempts failed. Cannot deploy.')
        sys.exit(1)
    print('Connected!')

    # 1. Check backend directory and current git status
    run(client, f'ls {BACKEND_DIR}', 'Check backend dir')
    run(client, f'cd {BACKEND_DIR} && git log -3 --oneline', 'Current git log')
    run(client, f'cd {BACKEND_DIR} && git remote -v', 'Git remote')

    # 2. Git pull
    code, out, err = run(client, f'cd {BACKEND_DIR} && git pull', 'git pull')
    if code != 0:
        print('WARNING: git pull failed, will try to copy files directly')

    # 3. Run SQL migrations
    print('\n=== Running SQL migrations ===')
    for name, sql in SQLS:
        print(f'\n-- Migration: {name}')
        # Escape single quotes in SQL for shell
        sql_escaped = sql.replace("'", "'\\''")
        cmd = f"mysql -u{DB_USER} -p'{DB_PASS}' {DB_NAME} -e '{sql_escaped}' 2>&1"
        code, out, err = run(client, cmd, f'SQL: {name}')

    # 4. npm install (in case of new deps)
    run(client, f'cd {BACKEND_DIR} && npm install --production 2>&1 | tail -5', 'npm install')

    # 5. Restart backend
    run(client, 'pm2 list', 'pm2 list (before restart)')
    code, out, err = run(client, 'pm2 restart all', 'pm2 restart all')
    if code != 0:
        run(client, f'cd {BACKEND_DIR} && pm2 restart ecosystem.config.js 2>/dev/null || pm2 restart app', 'pm2 restart alt')

    time.sleep(3)
    run(client, 'pm2 list', 'pm2 list (after restart)')

    # 6. Health check
    run(client, "curl -sk 'https://127.0.0.1:3001/api/v1/core/communities' | head -c 200", 'Health check')

    print('\n=== Deploy complete ===')
    client.close()

if __name__ == '__main__':
    main()
