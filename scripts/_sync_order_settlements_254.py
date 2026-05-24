"""254: 历史已完成订单补结算 + 分佣 pending→available"""
import json, ssl, sys, time, urllib.request, urllib.error
import paramiko
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST, USER, PWD = '8.140.204.254', 'root', 'edS904062'
REMOTE = '/root/community-backend/backend'
LOCAL = r'd:\CODE\project\community\backend'
BASE = 'https://jshsp1.eds-tech.cn/api/v1'

DEPLOY_FILES = [
    'sql/0446_order_settlement.sql',
    'src/services/orderSettlement.service.js',
    'src/modules/commission/models/PartnerCommissionBalance.js',
    'src/modules/commission/services/commission.service.js',
    'src/modules/market/controllers/market.controller.js',
    'src/modules/merchant/controllers/merchant.controller.js',
    'src/modules/merchant/routes.js',
    'src/controllers/serviceOrderController.js',
    'src/controllers/neighborAssistController.js',
    'src/controllers/userController.js',
    'src/modules/neighbor-assist/controllers/neighborAssist.controller.js',
    'src/modules/service-order/controllers/serviceOrder.controller.js',
]


def deploy_and_sql():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, USER, PWD, timeout=30, look_for_keys=False, allow_agent=False)
    sftp = c.open_sftp()
    for rel in DEPLOY_FILES:
        local = os.path.join(LOCAL, rel.replace('/', os.sep))
        remote = f'{REMOTE}/{rel}'
        sftp.put(local, remote)
        print('uploaded', rel)
    sftp.close()

    def run(cmd, t=120):
        _, o, e = c.exec_command(cmd, timeout=t)
        return (o.read() + e.read()).decode('utf-8', 'replace').strip()

    print('\n--- SQL 0446 ---')
    print(run(f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db < {REMOTE}/sql/0446_order_settlement.sql 2>&1"))

    print('\n--- restart ---')
    print(run(f'cd {REMOTE} && bash restart.sh 2>&1'))
    time.sleep(4)
    c.close()


def backfill_via_node():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, USER, PWD, timeout=30, look_for_keys=False, allow_agent=False)
    script = """
const db = require('/root/community-backend/backend/src/models');
const orderSettlement = require('/root/community-backend/backend/src/services/orderSettlement.service');
const { MarketOrder, ServiceOrder, NeighborAssistOrder } = db;

(async () => {
  let ok = 0, skip = 0, err = 0;
  const markets = await MarketOrder.findAll({ where: { pay_status: 'paid', order_status: 'completed' } });
  for (const o of markets) {
    try {
      const r = await orderSettlement.settleMarketOrder(o);
      if (r.credited || r.commissionConfirmed) ok++; else skip++;
    } catch (e) { err++; console.error('market', o.order_no, e.message); }
    await new Promise(r => setTimeout(r, 300));
  }
  const services = await ServiceOrder.findAll({ where: { pay_status: 'paid', status: 'completed' } });
  for (const o of services) {
    try {
      const r = await orderSettlement.settleServiceOrder(o);
      if (r.credited || r.commissionConfirmed) ok++; else skip++;
    } catch (e) { err++; console.error('service', o.id, e.message); }
    await new Promise(r => setTimeout(r, 300));
  }
  const neighbors = await NeighborAssistOrder.findAll({ where: { pay_status: 'paid', status: 'completed' } });
  for (const o of neighbors) {
    try {
      const r = await orderSettlement.settleNeighborOrder(o);
      if (r.credited || r.commissionConfirmed) ok++; else skip++;
    } catch (e) { err++; console.error('neighbor', o.id, e.message); }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(JSON.stringify({ ok, skip, err }));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
"""
    sftp = c.open_sftp()
    with sftp.open('/tmp/backfill_settlements.js', 'w') as f:
        f.write(script)
    sftp.close()
    _, o, e = c.exec_command('node /tmp/backfill_settlements.js 2>&1', timeout=600)
    out = (o.read() + e.read()).decode('utf-8', 'replace')
    print('\n--- backfill ---')
    print(out)
    c.close()


def api(method, path, token=None, body=None):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as ex:
        return {'_http': ex.code, '_body': ex.read().decode()}


def login(phone='13800000000'):
    d = api('POST', '/auth/login_sms', None, {'phone': phone, 'code': '024680'})
    return d.get('token') or (d.get('data') or {}).get('token')


if __name__ == '__main__':
    deploy_and_sql()
    backfill_via_node()
    tok = login()
    prof = api('GET', '/user/profile', tok)
    print('\n--- profile balances ---')
    print(json.dumps({
        'balance': prof.get('balance'),
        'market_merchant_balance': prof.get('market_merchant_balance'),
        'commission_available': prof.get('commission_available'),
        'commission_pending': prof.get('commission_pending'),
        'commission_roles': prof.get('commission_roles')
    }, ensure_ascii=False, indent=2))
