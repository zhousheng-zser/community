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

sqls = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code VARCHAR(32) DEFAULT NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by BIGINT DEFAULT NULL;",
    "ALTER TABLE market_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",
    "ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",
    "ALTER TABLE neighbor_assist_orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;",
]

for sql in sqls:
    run("mysql -uroot -p'CommunityPwd123!' community_db -e \"" + sql + "\" 2>&1")

check_sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='community_db' AND TABLE_NAME='users' AND COLUMN_NAME IN ('points','invite_code','invited_by');"
run("mysql -uroot -p'CommunityPwd123!' community_db -e \"" + check_sql + "\" 2>&1")

s.close()
print("Done")
