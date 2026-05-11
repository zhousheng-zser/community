import paramiko, sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    print('>>> ' + cmd[:120])
    print(out + err)
    return out + err

DB = "mysql -uroot -p'CommunityPwd123!' community_db"

sqls = [
    # Users table extensions
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code VARCHAR(32) DEFAULT NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by BIGINT DEFAULT NULL;",

    # Order tables: points_earned
    "ALTER TABLE market_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",
    "ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",
    "ALTER TABLE neighbor_assist_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",

    # System configs (commission rates)
    """CREATE TABLE IF NOT EXISTS system_configs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      config_key VARCHAR(128) NOT NULL UNIQUE,
      config_value VARCHAR(512) DEFAULT '',
      config_type ENUM('decimal','integer','string','json') DEFAULT 'string',
      is_public TINYINT(1) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Partner roles
    """CREATE TABLE IF NOT EXISTS partner_roles (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      role ENUM('promoter','district_partner','market_partner') NOT NULL,
      status ENUM('active','inactive','pending_approval') DEFAULT 'active',
      approved_at DATETIME DEFAULT NULL,
      approved_by BIGINT DEFAULT NULL,
      district_code VARCHAR(32) DEFAULT NULL,
      market_code VARCHAR(32) DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_role (user_id, role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Partner relations (cached chain)
    """CREATE TABLE IF NOT EXISTS partner_relations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      promoter_user_id BIGINT NOT NULL UNIQUE,
      district_partner_user_id BIGINT DEFAULT NULL,
      market_partner_user_id BIGINT DEFAULT NULL,
      is_valid TINYINT(1) DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Commission distributions
    """CREATE TABLE IF NOT EXISTS commission_distributions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      order_type VARCHAR(32) DEFAULT 'market',
      order_amount DECIMAL(12,2) DEFAULT 0,
      commission_pool DECIMAL(12,2) DEFAULT 0,
      beneficiary_user_id BIGINT DEFAULT NULL,
      beneficiary_role ENUM('headquarters','promoter','district_partner','market_partner') NOT NULL,
      role_percentage DECIMAL(5,4) DEFAULT 0,
      commission_amount DECIMAL(12,2) DEFAULT 0,
      status ENUM('pending','available','withdrawn','refunded') DEFAULT 'pending',
      promoter_user_id BIGINT DEFAULT NULL,
      distributed_at DATETIME DEFAULT NULL,
      settled_at DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_order (order_id),
      INDEX idx_beneficiary (beneficiary_user_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Partner commission balances
    """CREATE TABLE IF NOT EXISTS partner_commission_balances (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      role ENUM('promoter','district_partner','market_partner') NOT NULL,
      total_earned DECIMAL(12,2) DEFAULT 0,
      available_amount DECIMAL(12,2) DEFAULT 0,
      withdrawn_amount DECIMAL(12,2) DEFAULT 0,
      pending_amount DECIMAL(12,2) DEFAULT 0,
      frozen_amount DECIMAL(12,2) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_role (user_id, role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Promoter withdrawals
    """CREATE TABLE IF NOT EXISTS promoter_withdrawals (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status ENUM('pending','processing','completed','rejected') DEFAULT 'pending',
      remark VARCHAR(512) DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",

    # Insert default commission config
    """INSERT IGNORE INTO system_configs (config_key, config_value, config_type, is_public) VALUES
      ('commission.global_rate', '0.10', 'decimal', 1),
      ('commission.headquarters_pct', '0.05', 'decimal', 1),
      ('commission.market_partner_pct', '0.05', 'decimal', 1),
      ('commission.district_partner_pct', '0.20', 'decimal', 1),
      ('commission.promoter_pct', '0.70', 'decimal', 1);""",
]

for sql in sqls:
    one_line = ' '.join(sql.split())
    run(DB + ' -e "' + one_line.replace('"', '\\"') + '" 2>&1')

# Verify
run(DB + " -e \"SHOW TABLES LIKE '%commission%';\" 2>&1")
run(DB + " -e \"SELECT * FROM system_configs WHERE config_key LIKE 'commission%';\" 2>&1")

s.close()
print("Done")
