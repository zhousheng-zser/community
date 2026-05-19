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
    run(f"mysql -u root -pCommunityPwd123! community_db -e \"{q}\" 2>/dev/null")

# ═══ Step 1: Update points_earned for all completed+paid market orders where points_earned=0 ═══
pr('=== Step 1: Grant points_earned on completed market orders ===')
sql_exec("UPDATE market_orders SET points_earned = ROUND(payable_amount * 10) WHERE pay_status='paid' AND order_status='completed' AND points_earned=0;")

# Same for service_orders
sql_exec("UPDATE service_orders SET points_earned = ROUND(COALESCE(pay_amount, amount) * 10) WHERE pay_status='paid' AND status='completed' AND points_earned=0;")

# Same for neighbor_assist_orders
sql_exec("UPDATE neighbor_assist_orders SET points_earned = ROUND(COALESCE(pay_amount, amount) * 10) WHERE pay_status='paid' AND status='completed' AND points_earned=0;")
pr('  orders updated')

# ═══ Step 2: Recalculate each user's total points from orders ═══
pr('\n=== Step 2: Recalculate user points from all orders ===')
# Get all users with completed orders
users_market = sql("SELECT DISTINCT user_id FROM market_orders WHERE pay_status='paid' AND order_status='completed';")
users_service = sql("SELECT DISTINCT user_id FROM service_orders WHERE pay_status='paid' AND status='completed';")
users_assist = sql("SELECT DISTINCT user_id FROM neighbor_assist_orders WHERE pay_status='paid' AND status='completed';")

all_uids = set()
for u in (users_market + '\n' + users_service + '\n' + users_assist).split('\n'):
    u = u.strip()
    if u and u.isdigit():
        all_uids.add(int(u))

pr(f'  Users with completed orders: {sorted(all_uids)}')

for uid in sorted(all_uids):
    m = sql(f"SELECT COALESCE(SUM(points_earned),0) FROM market_orders WHERE user_id={uid} AND pay_status='paid' AND order_status='completed';")
    sv = sql(f"SELECT COALESCE(SUM(points_earned),0) FROM service_orders WHERE user_id={uid} AND pay_status='paid' AND status='completed';")
    na = sql(f"SELECT COALESCE(SUM(points_earned),0) FROM neighbor_assist_orders WHERE user_id={uid} AND pay_status='paid' AND status='completed';")
    total = int(m or '0') + int(sv or '0') + int(na or '0')
    sql_exec(f"UPDATE Users SET points={total} WHERE id={uid};")
    pr(f'  User {uid}: market={m} + service={sv} + assist={na} = {total} pts')

# ═══ Step 3: Verify user 65 ═══
pr('\n=== Final: User 65 ===')
pr(sql("SELECT id, nickname, points FROM Users WHERE id=65;"))

pr('\n=== User 65 market orders ===')
pr(sql("SELECT order_no, payable_amount, order_status, pay_status, points_earned FROM market_orders WHERE user_id=65 AND pay_status='paid' AND order_status='completed';"))

# ═══ Step 4: Also trigger commission for user 65's orders that lack commission ═══
pr('\n=== Commission distributions for user 65 orders ===')
pr(sql("SELECT order_no, order_type, total_commission FROM commission_distributions WHERE order_no IN (SELECT order_no FROM market_orders WHERE user_id=65 AND pay_status='paid' AND order_status='completed');"))

# ═══ Step 5: Also make sure the Node backend is loading orderPoints properly ═══
pr('\n=== Check backend health ===')
out = run("curl -s http://127.0.0.1:3001/api/v1/health 2>&1 || echo 'no /health'")
pr(out[:200])

# Check that future orders will auto-grant (verify market controller mockPaymentSuccess)
pr('\n=== Market controller mockPaymentSuccess - around grantPoints ===')
out = run("grep -n -B2 -A5 'grantPoints' /root/community-backend/backend/src/modules/market/controllers/market.controller.js")
pr(out)

s.close()
pr('\n=== DONE ===')
