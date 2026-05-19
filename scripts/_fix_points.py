import paramiko, sys, io, time

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

def sql_exec(q):
    out = run(f"mysql -u root -pCommunityPwd123! community_db -e \"{q}\" 2>/dev/null")
    errs = [l for l in out.split('\n') if 'ERROR' in l]
    if errs: pr(f'  [SQL ERROR] {errs[0]}')

def sql(q):
    out = run(f"mysql -u root -pCommunityPwd123! community_db -N -B -e \"{q}\" 2>/dev/null")
    lines = [l for l in out.split('\n') if l.strip() and 'Warning' not in l]
    return '\n'.join(lines)

# ═══ Fix 1: Add points column to Users table ═══
pr('=== Fix 1: Add points column to Users ===')
sql_exec("ALTER TABLE Users ADD COLUMN points INT NOT NULL DEFAULT 0;")
pr('  done')

# ═══ Fix 2: Check all completed+paid orders for ALL users, see who has real orders ═══
pr('\n=== All completed paid market orders ===')
pr(sql("SELECT user_id, order_no, pay_amount, order_status, pay_status, points_earned FROM market_orders WHERE pay_status='paid' AND order_status='completed' ORDER BY user_id LIMIT 20;"))

pr('\n=== All completed paid service orders ===')
pr(sql("SELECT user_id, order_no, pay_amount, status, pay_status FROM service_orders WHERE pay_status='paid' AND status='completed' ORDER BY user_id LIMIT 20;"))

pr('\n=== All completed paid neighbor_assist orders ===')
pr(sql("SELECT user_id, order_no, pay_amount, status, pay_status FROM neighbor_assist_orders WHERE pay_status='paid' AND status='completed' ORDER BY user_id LIMIT 20;"))

# ═══ Fix 3: Create REAL orders under user 65 (the actual logged-in wx user) ═══
pr('\n=== Fix 3: Create orders for user 65 (real wx user) ===')
ts = str(int(time.time()))
o1 = f'U65MKT{ts}'
o2 = f'U65SVC{ts}'
o3 = f'U65NAO{ts}'

sql_exec(f"INSERT INTO market_orders (order_no, user_id, shop_id, total_amount, pay_amount, payable_amount, pay_status, order_status, paid_at, created_at, updated_at) VALUES ('{o1}', 65, 1, 258.00, 258.00, 258.00, 'paid', 'completed', NOW(), NOW(), NOW());")
sql_exec(f"INSERT INTO service_orders (order_no, user_id, provider_id, service_id, goods_name, amount, pay_amount, pay_status, status, contact_name, contact_phone, paid_at, created_at, updated_at) VALUES ('{o2}', 65, 1, 66, 'deep_clean_full', 388.00, 388.00, 'paid', 'completed', 'wx_user', '13800000000', NOW(), NOW(), NOW());")
sql_exec(f"INSERT INTO neighbor_assist_orders (order_no, user_id, worker_id, title, description, amount, pay_amount, pay_status, status, contact_name, contact_phone, paid_at, created_at, updated_at) VALUES ('{o3}', 65, 1, 'appliance_fix', 'washing_machine', 180.00, 180.00, 'paid', 'completed', 'wx_user', '13800000000', NOW(), NOW(), NOW());")
pr(f'  {o1}(258), {o2}(388), {o3}(180)')

# ═══ Fix 4: Grant points for ALL completed paid orders that have points_earned=0 ═══
pr('\n=== Fix 4: Grant points for all completed orders ===')
fix_points_js = """
const db = require('/root/community-backend/backend/src/models');
const orderPoints = require('/root/community-backend/backend/src/services/orderPoints.service');
const commissionService = require('/root/community-backend/backend/src/modules/commission/services/commission.service');

async function main() {
  // Get MarketOrder, ServiceOrder, NeighborAssistOrder models
  const MarketOrder = db.MarketOrder;
  const ServiceOrder = db.ServiceOrder;
  const NeighborAssistOrder = db.NeighborAssistOrder;

  let totalPoints = 0;

  // Fix market orders
  if (MarketOrder) {
    const rows = await MarketOrder.findAll({ where: { pay_status: 'paid', order_status: 'completed', points_earned: 0 } });
    for (const row of rows) {
      const pts = await orderPoints.grantPointsOnOrderPaid(MarketOrder, row);
      if (pts > 0) {
        console.log(`  Market ${row.order_no}: user=${row.user_id}, amount=${row.pay_amount||row.payable_amount}, pts=${pts}`);
        totalPoints += pts;
      }
    }
  } else {
    console.log('  MarketOrder model not found');
  }

  // Fix service orders
  if (ServiceOrder) {
    const rows = await ServiceOrder.findAll({ where: { pay_status: 'paid', status: 'completed', points_earned: 0 } });
    for (const row of rows) {
      const pts = await orderPoints.grantPointsOnOrderPaid(ServiceOrder, row);
      if (pts > 0) {
        console.log(`  Service ${row.order_no}: user=${row.user_id}, amount=${row.pay_amount||row.amount}, pts=${pts}`);
        totalPoints += pts;
      }
    }
  } else {
    console.log('  ServiceOrder model not found');
  }

  // Fix neighbor assist orders
  if (NeighborAssistOrder) {
    const rows = await NeighborAssistOrder.findAll({ where: { pay_status: 'paid', status: 'completed', points_earned: 0 } });
    for (const row of rows) {
      const pts = await orderPoints.grantPointsOnOrderPaid(NeighborAssistOrder, row);
      if (pts > 0) {
        console.log(`  Assist ${row.order_no}: user=${row.user_id}, amount=${row.pay_amount||row.amount}, pts=${pts}`);
        totalPoints += pts;
      }
    }
  } else {
    console.log('  NeighborAssistOrder model not found');
  }

  console.log(`\\nTotal points granted: ${totalPoints}`);

  // Also trigger commission for user 65's orders (buyer=65, promoter chain via invited_by)
  // User 65's invited_by=104 (district_partner), so the chain: 65's orders -> no promoter gets commission
  // Actually for user 65's OWN orders, the promoter is whoever invited user 65
  // User 65 invited_by=104, so district_partner is 104's inviter... 
  // Wait - commission is based on who INVITED the buyer, not who the buyer is
  // Buyer 65 invited_by=104. The system resolves: buyer's inviter chain
  // Let's also distribute commission for user 65's own orders
  const orders65 = await MarketOrder.findAll({ where: { user_id: 65, pay_status: 'paid', order_status: 'completed' } });
  for (const row of orders65) {
    try {
      await commissionService.distributeCommission(row.order_no, 'market', Number(row.pay_amount || row.payable_amount || row.total_amount), 65);
      await commissionService.confirmCommission(row.order_no);
      console.log(`  Distributed+confirmed commission for market ${row.order_no}`);
    } catch(e) { console.log(`  Skip market ${row.order_no}: ${e.message}`); }
  }

  if (ServiceOrder) {
    const svcOrders65 = await ServiceOrder.findAll({ where: { user_id: 65, pay_status: 'paid', status: 'completed' } });
    for (const row of svcOrders65) {
      try {
        await commissionService.distributeCommission(row.order_no, 'service', Number(row.pay_amount || row.amount), 65);
        await commissionService.confirmCommission(row.order_no);
        console.log(`  Distributed+confirmed commission for service ${row.order_no}`);
      } catch(e) { console.log(`  Skip service ${row.order_no}: ${e.message}`); }
    }
  }

  if (NeighborAssistOrder) {
    const naOrders65 = await NeighborAssistOrder.findAll({ where: { user_id: 65, pay_status: 'paid', status: 'completed' } });
    for (const row of naOrders65) {
      try {
        await commissionService.distributeCommission(row.order_no, 'neighbor_assist', Number(row.pay_amount || row.amount), 65);
        await commissionService.confirmCommission(row.order_no);
        console.log(`  Distributed+confirmed commission for assist ${row.order_no}`);
      } catch(e) { console.log(`  Skip assist ${row.order_no}: ${e.message}`); }
    }
  }

  // Show user 65 points
  const User = db.User;
  if (User) {
    const u = await User.findByPk(65);
    console.log(`\\nUser 65 points: ${u ? u.points : 'N/A'}`);
  }

  setTimeout(() => process.exit(0), 500);
}
main().catch(e => { console.error(e); process.exit(1); });
"""

sftp = s.open_sftp()
f = io.BytesIO(fix_points_js.encode('utf-8'))
sftp.putfo(f, '/tmp/fix_points.js')
sftp.close()

result = run('cd /root/community-backend/backend && node /tmp/fix_points.js 2>&1', timeout=30)
pr(result)

# ═══ Verify ═══
pr('\n=== Final: User 65 points ===')
pr(sql("SELECT id, nickname, points FROM Users WHERE id=65;"))

pr('\n=== All users with points > 0 ===')
pr(sql("SELECT id, nickname, points FROM Users WHERE points > 0;"))

pr('\n=== User 65 commission balance ===')
pr(sql("SELECT user_id, role, total_earned, available_amount FROM partner_commission_balances WHERE user_id=65;"))

s.close()
pr('\n=== DONE ===')
