import paramiko, sys, io

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=30):
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

# Fix commission chain: user 65 should be invited by promoter 105 (promoter_wang)
# This way when user 65 buys: promoter=105, district=104, market=103
pr('=== Fix commission chain for user 65 ===')
pr(f'  Before: invited_by = {sql("SELECT invited_by FROM Users WHERE id=65;")}')
sql_exec("UPDATE Users SET invited_by=105 WHERE id=65;")
pr(f'  After: invited_by = {sql("SELECT invited_by FROM Users WHERE id=65;")}')

# Also ensure promoter 105 has partner_role and is active
pr('\n=== Verify promoter 105 setup ===')
pr(sql("SELECT * FROM partner_roles WHERE user_id=105;"))

# Cache partner_relations for user 65 (buyer) -> 105 (promoter) -> 104 (district) -> 103 (market)
pr('\n=== Update partner_relations for user 65 ===')
sql_exec("DELETE FROM partner_relations WHERE user_id=65;")
sql_exec("INSERT INTO partner_relations (user_id, promoter_id, district_partner_id, market_partner_id, resolved_at, created_at, updated_at) VALUES (65, 105, 104, 103, NOW(), NOW(), NOW());")
pr('  done')

# Now distribute commission for user 65's completed orders
pr('\n=== Distribute commission for user 65 completed orders ===')

commission_js = """
const db = require('/root/community-backend/backend/src/models');
const commissionService = require('/root/community-backend/backend/src/modules/commission/services/commission.service');

async function main() {
  const MarketOrder = db.MarketOrder;
  const orders = await MarketOrder.findAll({
    where: { user_id: 65, pay_status: 'paid', order_status: 'completed' }
  });
  
  console.log(`Found ${orders.length} completed orders for user 65`);
  
  for (const row of orders) {
    const payAmount = Number(row.payable_amount || row.pay_amount || row.total_amount || 0);
    console.log(`  Processing ${row.order_no}: amount=${payAmount}`);
    try {
      await commissionService.distributeCommission(row.order_no, 'market', payAmount, 65);
      await commissionService.confirmCommission(row.order_no);
      console.log(`    OK - distributed & confirmed`);
    } catch(e) {
      console.log(`    Error: ${e.message}`);
    }
  }
  
  // Show final balances
  const { sequelize } = db;
  const [balances] = await sequelize.query(
    "SELECT user_id, role, total_earned, available_amount, pending_amount FROM partner_commission_balances ORDER BY user_id"
  );
  console.log('\\nCommission balances:');
  for (const b of balances) {
    console.log(`  User ${b.user_id} (${b.role}): total=${b.total_earned}, available=${b.available_amount}, pending=${b.pending_amount}`);
  }
  
  setTimeout(() => process.exit(0), 500);
}
main().catch(e => { console.error(e.message); process.exit(1); });
"""

sftp = s.open_sftp()
f = io.BytesIO(commission_js.encode('utf-8'))
sftp.putfo(f, '/tmp/fix_commission65.js')
sftp.close()

result = run('cd /root/community-backend/backend && node /tmp/fix_commission65.js 2>&1', timeout=30)
pr(result)

# Final verification
pr('\n=== User 65 final state ===')
pr(f'  Points: {sql("SELECT points FROM Users WHERE id=65;")}')
pr(f'  Commission: {sql("SELECT role, total_earned, available_amount FROM partner_commission_balances WHERE user_id=65;")}')

# Also check user 105 (promoter who gets commission from user 65's orders)
pr('\n=== Promoter 105 commission ===')
pr(sql("SELECT role, total_earned, available_amount FROM partner_commission_balances WHERE user_id=105;"))
pr('\n=== District 104 commission ===')
pr(sql("SELECT role, total_earned, available_amount FROM partner_commission_balances WHERE user_id=104;"))
pr('\n=== Market 103 commission ===')
pr(sql("SELECT role, total_earned, available_amount FROM partner_commission_balances WHERE user_id=103;"))

s.close()
pr('\n=== DONE ===')
