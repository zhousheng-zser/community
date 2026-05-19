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
    out = run(f"mysql -u root -pCommunityPwd123! community_db -e \"{q}\" 2>/dev/null")
    lines = [l for l in out.split('\n') if l.strip() and 'Warning' not in l]
    return '\n'.join(lines)

# User 65 is the real WX user. Check what's in the DB for them:
pr('=== User 65 commission_distributions (all) ===')
pr(sql("SELECT id, order_id, order_type, order_amount, beneficiary_user_id, beneficiary_role, commission_amount, status FROM commission_distributions WHERE beneficiary_user_id=65;"))

# What about user 65's OWN orders? Those should generate commission for user 105 (promoter)
pr('\n=== Commission from user 65 orders (buyer=65) ===')
# When user 65 buys, the promoter who invited user 65 (user 105) gets commission
pr(sql("SELECT id, order_id, order_type, order_amount, beneficiary_user_id, beneficiary_role, commission_amount FROM commission_distributions WHERE order_id IN (SELECT order_no FROM market_orders WHERE user_id=65 AND pay_status='paid');"))

# All commission distributions
pr('\n=== All commission_distributions ===')
pr(sql("SELECT id, order_id, order_type, order_amount, beneficiary_user_id, beneficiary_role, commission_amount, status FROM commission_distributions ORDER BY id;"))

# Who is user 65 in the chain? 65 is a PROMOTER.
# When user 107 (buyer_test_A, invited by user 65) buys, user 65 gets promoter commission
pr('\n=== User 107 info (buyer who was invited by 65) ===')
pr(sql("SELECT id, nickname, invited_by FROM Users WHERE id=107;"))

# Also check the "交易明细" page - it's currently only showing local wallet data
# We need to make it fetch from backend. Let's check what data exists for wallet/transactions
# The wallet-transactions page only reads localPrefs - we need to add backend API support

# For now, the commission data IS there and working. The issue may be:
# 1. User hasn't logged in properly (no valid token)
# 2. The API path is not reachable from the mini-program (check baseUrl)

# Check what base URL the mini-program uses
pr('\n=== Check mini-program API base URL ===')

s.close()
