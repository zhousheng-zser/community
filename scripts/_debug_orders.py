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

# Check actual market_orders table structure
pr('=== market_orders columns ===')
pr(sql("DESCRIBE market_orders;"))

pr('\n=== ALL market_orders for user 65 ===')
pr(sql("SELECT id, order_no, user_id, total_amount, pay_amount, order_status, pay_status, points_earned FROM market_orders WHERE user_id=65 LIMIT 10;"))

pr('\n=== ALL completed market_orders ===')
pr(sql("SELECT id, order_no, user_id, pay_amount, order_status, pay_status, points_earned FROM market_orders WHERE order_status='completed' LIMIT 10;"))

pr('\n=== Check if status field used differently ===')
pr(sql("SELECT DISTINCT order_status FROM market_orders LIMIT 10;"))
pr(sql("SELECT DISTINCT pay_status FROM market_orders LIMIT 10;"))

# Check the Node script found orders - maybe different model name
pr('\n=== MarketOrder model table name ===')
out = run("grep -n 'tableName\\|modelName' /root/community-backend/backend/src/models/MarketOrder.js 2>/dev/null || grep -rn 'market_order\\|MarketOrder' /root/community-backend/backend/src/models/ 2>/dev/null | head -10")
pr(out)

# Check if there's a different orders table
pr('\n=== Tables with "order" ===')
pr(sql("SHOW TABLES LIKE '%order%';"))

s.close()
