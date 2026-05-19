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

# Check the suspicious high-amount order
pr('=== Suspicious order MK202604302328507064 ===')
pr(sql("SELECT order_no, user_id, total_amount, pay_amount, payable_amount, order_status, points_earned FROM market_orders WHERE order_no='MK202604302328507064';"))

# Recalculate user 65's correct points from all completed orders
pr('\n=== User 65 all completed market orders with points_earned ===')
pr(sql("SELECT order_no, pay_amount, payable_amount, points_earned FROM market_orders WHERE user_id=65 AND pay_status='paid' AND order_status='completed';"))

pr('\n=== User 65 total points from all orders ===')
total_m = sql("SELECT COALESCE(SUM(points_earned),0) FROM market_orders WHERE user_id=65 AND pay_status='paid' AND order_status='completed';")
total_s = sql("SELECT COALESCE(SUM(points_earned),0) FROM service_orders WHERE user_id=65 AND pay_status='paid' AND status='completed';")
total_n = sql("SELECT COALESCE(SUM(points_earned),0) FROM neighbor_assist_orders WHERE user_id=65 AND pay_status='paid' AND status='completed';")
pr(f'  Market: {total_m}, Service: {total_s}, Assist: {total_n}')
total = int(total_m or '0') + int(total_s or '0') + int(total_n or '0')
pr(f'  Correct total: {total}')

# Fix user 65's points to correct value
sql_exec(f"UPDATE Users SET points={total} WHERE id=65;")
pr(f'\n=== Updated user 65 points to {total} ===')

# Verify
pr('\n=== Final user 65 points ===')
pr(sql("SELECT id, nickname, points FROM Users WHERE id=65;"))

# Test API via curl with proper auth
pr('\n=== Quick API test ===')
out = run("curl -s 'http://127.0.0.1:3001/api/v1/user/profile' -H 'x-user-id: 65' -H 'Content-Type: application/json' 2>&1")
pr(out[:500] if out else '(empty)')

s.close()
