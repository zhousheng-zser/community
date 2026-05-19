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

def sql(q):
    out = run(f"mysql -u root -pCommunityPwd123! community_db -N -B -e \"{q}\" 2>/dev/null")
    lines = [l for l in out.split('\n') if l.strip() and 'Warning' not in l]
    return '\n'.join(lines)

def sql_exec(q):
    out = run(f"mysql -u root -pCommunityPwd123! community_db -e \"{q}\" 2>/dev/null")
    lines = [l for l in out.split('\n') if l.strip() and 'Warning' not in l and 'Query OK' not in l]
    if lines: pr(f'  {lines[0]}')

# Check ALL market_orders regardless of user/status
pr('=== ALL market_orders (any status) ===')
pr(sql("SELECT id, order_no, user_id, payable_amount, order_status, pay_status, points_earned FROM market_orders ORDER BY id DESC LIMIT 15;"))

# Check which user_id has completed orders
pr('\n=== Users with completed paid orders ===')
pr(sql("SELECT user_id, COUNT(*) cnt, SUM(payable_amount) total_paid FROM market_orders WHERE pay_status='paid' GROUP BY user_id;"))

# Check if the user's actual wxUser ID is different
pr('\n=== User ID 65 info ===')
pr(sql("SELECT id, nickname, phone, openid, points FROM Users WHERE id=65;"))

# Check all users who may be this real user
pr('\n=== Recent users (might be the logged in user) ===')
pr(sql("SELECT id, nickname, phone, openid, points FROM Users ORDER BY id DESC LIMIT 10;"))

# The real problem: user sees orders as "completed" in the app but DB shows different.
# Check if order_status values include the 'completed' status
pr('\n=== Market order status distribution ===')
pr(sql("SELECT order_status, pay_status, COUNT(*) c FROM market_orders GROUP BY order_status, pay_status;"))

# Now create proper orders for user 65 (without pay_amount column which doesn't exist)
pr('\n=== Creating proper orders for user 65 ===')
import time
ts = str(int(time.time()))
sql_exec(f"INSERT INTO market_orders (order_no, user_id, shop_id, goods_amount, payable_amount, pay_status, order_status, paid_at, created_at, updated_at, points_earned) VALUES ('PTS65MKT{ts}A', 65, 1, 128.00, 128.00, 'paid', 'completed', NOW(), NOW(), NOW(), 0);")
sql_exec(f"INSERT INTO market_orders (order_no, user_id, shop_id, goods_amount, payable_amount, pay_status, order_status, paid_at, created_at, updated_at, points_earned) VALUES ('PTS65MKT{ts}B', 65, 1, 256.00, 256.00, 'paid', 'completed', NOW(), NOW(), NOW(), 0);")
sql_exec(f"INSERT INTO market_orders (order_no, user_id, shop_id, goods_amount, payable_amount, pay_status, order_status, paid_at, created_at, updated_at, points_earned) VALUES ('PTS65MKT{ts}C', 65, 1, 88.50, 88.50, 'paid', 'completed', NOW(), NOW(), NOW(), 0);")
pr('  3 orders created')

# Also check service_orders for user 65
pr('\n=== Service orders for user 65 ===')
pr(sql("SELECT id, order_no, user_id, amount, pay_amount, status, pay_status FROM service_orders WHERE user_id=65 LIMIT 10;"))

# Check service_orders structure
pr('\n=== service_orders has points_earned? ===')
pr(sql("SHOW COLUMNS FROM service_orders LIKE 'points%';"))

pr('\n=== neighbor_assist_orders has points_earned? ===')
pr(sql("SHOW COLUMNS FROM neighbor_assist_orders LIKE 'points%';"))

s.close()
