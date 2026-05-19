import paramiko, sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=15):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try: out = stdout.read().decode('utf-8', 'ignore')
    except: out = ''
    try: err = stderr.read().decode('utf-8', 'ignore')
    except: err = ''
    return out + err

def pr(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', 'replace'))
    sys.stdout.buffer.flush()

def sql(query):
    out = run(f"mysql -u root -pCommunityPwd123! community_db -N -B -e \"{query}\" 2>/dev/null")
    lines = [l for l in out.split('\n') if l.strip() and 'Warning' not in l]
    return '\n'.join(lines)

# Check user 65's completed orders (real wx user)
pr('=== User 65 completed market orders ===')
pr(sql("SELECT order_no, total_amount, pay_amount, pay_status, order_status, points_earned FROM market_orders WHERE user_id=65 AND order_status='completed' LIMIT 10;"))

pr('\n=== User 65 completed service orders ===')
pr(sql("SELECT order_no, amount, pay_amount, pay_status, status FROM service_orders WHERE user_id=65 AND status='completed' LIMIT 10;"))

pr('\n=== User 65 completed neighbor_assist orders ===')
pr(sql("SELECT order_no, amount, pay_amount, pay_status, status FROM neighbor_assist_orders WHERE user_id=65 AND status='completed' LIMIT 10;"))

# Check Users table for points column
pr('\n=== Users table - points column? ===')
pr(sql("SHOW COLUMNS FROM Users LIKE 'points';"))

# Check where points are stored - maybe a separate table?
pr('\n=== Tables with points ===')
pr(run("mysql -u root -pCommunityPwd123! community_db -N -B -e \"SHOW TABLES LIKE '%point%';\" 2>/dev/null"))

# Check market_orders columns for points_earned
pr('\n=== market_orders points_earned column ===')
pr(sql("SHOW COLUMNS FROM market_orders LIKE 'points%';"))

# Check orderPoints service
pr('\n=== orderPoints service ===')
pr(run("cat /root/community-backend/backend/src/services/orderPoints.service.js 2>&1"))

s.close()
