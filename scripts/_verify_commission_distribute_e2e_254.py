#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
254 单线程推广分佣 E2E（禁止并发写）
前置：买家 invited_by → 活跃推客；分佣池 = 订单 platform_fee_amount
覆盖：邻里帮帮 / 本地集市 / 直约技工 / 直约服务商（各 1 笔支付后校验 commission_distributions）
"""
import json
import ssl
import sys
import time
import urllib.error
import urllib.request

try:
    import paramiko
except ImportError:
    print('pip install paramiko')
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '8.140.204.254'
SSH_USER = 'root'
SSH_PASS = 'edS904062'
BASE = 'https://jshsp1.eds-tech.cn/api/v1'
PHONE = '13800000000'
SMS_CODE = '024680'
BUYER_UID = '313949215099195408'
PROMOTER_UID = '313949215095001088'
SLEEP = 3
FEE_RATE = 0.10  # 254 默认平台抽成

REMOTE_BACKEND = '/root/community-backend/backend'

DEPLOY_FILES = [
    ('backend/src/modules/commission/services/commission.service.js',
     f'{REMOTE_BACKEND}/src/modules/commission/services/commission.service.js'),
    ('backend/src/controllers/neighborAssistController.js',
     f'{REMOTE_BACKEND}/src/controllers/neighborAssistController.js'),
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
results = []


def log(msg):
    print(msg, flush=True)


def sleep():
    time.sleep(SLEEP)


def ssh():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, SSH_USER, SSH_PASS, timeout=25, look_for_keys=False, allow_agent=False)
    return c


def mysql_exec(sql_block):
    c = ssh()
    cmd = f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db 2>&1 <<'EOSQL'\n{sql_block}\nEOSQL"
    _, o, e = c.exec_command(cmd, timeout=60)
    out = (o.read() + e.read()).decode('utf-8', 'replace').strip()
    c.close()
    return out


def mysql_q(q):
    c = ssh()
    esc = q.replace('"', '\\"')
    cmd = f"MYSQL_PWD='CommunityPwd123!' mysql -N -B -uroot community_db -e \"{esc}\" 2>&1"
    _, o, e = c.exec_command(cmd, timeout=30)
    out = (o.read() + e.read()).decode('utf-8', 'replace').strip()
    c.close()
    return out


def api(method, path, body=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            raw = r.read().decode('utf-8', 'replace')
            try:
                return r.status, json.loads(raw)
            except json.JSONDecodeError:
                return r.status, {'raw': raw[:500]}
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', 'replace')
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {'raw': raw[:500]}


def login():
    for attempt in range(8):
        st, res = api('POST', '/auth/login_sms', {'phone': PHONE, 'code': SMS_CODE})
        tok = res.get('token') or (res.get('data') or {}).get('token')
        if tok:
            return tok
        if st in (502, 503, 504):
            log(f'  登录重试 {attempt + 1}/8 (HTTP {st})')
            time.sleep(5)
            continue
        raise RuntimeError(f'登录失败 {st} {res}')
    raise RuntimeError('API 未就绪')


def record(name, ok, detail):
    results.append({'name': name, 'ok': ok, 'detail': detail})
    log(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")


def deploy_fixes():
    log('=== 部署分佣修复 ===')
    import os
    c = ssh()
    sftp = c.open_sftp()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for local_rel, remote in DEPLOY_FILES:
        local = os.path.join(root, local_rel.replace('/', os.sep))
        sftp.put(local, remote)
        log(f'  uploaded {local_rel}')
    sftp.close()
    _, o, e = c.exec_command(
        'cd /root/community-backend/backend && pm2 restart community-benefit-api 2>&1 | tail -5',
        timeout=40
    )
    log((o.read() + e.read()).decode('utf-8', 'replace'))
    c.close()
    time.sleep(12)


def setup_commission_chain():
    log('=== 准备推广分佣链路 ===')
    import os
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_path = os.path.join(root, 'backend', 'sql', '0445_commission_distribute.sql')
    c = ssh()
    remote = '/root/community-backend/backend/sql/0445_commission_distribute.sql'
    sftp = c.open_sftp()
    try:
        sftp.mkdir('/root/community-backend/backend/sql')
    except OSError:
        pass
    sftp.put(sql_path, remote)
    sftp.close()
    _, o, e = c.exec_command(f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db < {remote} 2>&1", timeout=60)
    mig = (o.read() + e.read()).decode('utf-8', 'replace').strip()
    if mig and 'ERROR' in mig and 'Duplicate' not in mig:
        log('  迁移: ' + mig[:300])
    else:
        log('  0445 分佣表/invited_by 已就绪')
    c.close()
    sleep()

    sql = f"""
UPDATE users SET invited_by = {PROMOTER_UID} WHERE id = {BUYER_UID};
INSERT INTO partner_roles (user_id, role, status, created_at, updated_at)
SELECT {PROMOTER_UID}, 'promoter', 'active', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM partner_roles WHERE user_id={PROMOTER_UID} AND role='promoter' AND status='active' LIMIT 1
);
"""
    out = mysql_exec(sql)
    if 'ERROR' in out:
        log('  绑定: ' + out[:200])
    row = mysql_q(
        f"SELECT u.invited_by, (SELECT COUNT(*) FROM partner_roles p "
        f"WHERE p.user_id={PROMOTER_UID} AND p.role='promoter' AND p.status='active') "
        f"FROM users u WHERE u.id={BUYER_UID}"
    )
    log(f'  买家 invited_by + 推客角色: {row}')
    sleep()


def discover_ids():
    goods = mysql_q('SELECT id, shop_id, price FROM merchant_goods WHERE status="on_sale" AND is_published=1 LIMIT 1')
    svc = mysql_q('SELECT id, price FROM services WHERE is_published=1 ORDER BY id LIMIT 1')
    worker = mysql_q(
        f'SELECT user_id FROM worker_profiles WHERE status="active" AND community_id=1 '
        f'AND user_id != {BUYER_UID} LIMIT 1'
    )
    sp = mysql_q('SELECT id FROM service_provider_profiles WHERE status="active" AND community_id=1 LIMIT 1')
    ids = {}
    if goods and 'ERROR' not in goods:
        g = goods.split('\t')
        ids.update({'goods_id': int(g[0]), 'shop_id': int(g[1]), 'goods_price': float(g[2])})
    if svc and 'ERROR' not in svc:
        s = svc.split('\t')
        ids.update({'service_id': int(s[0]), 'service_price': float(s[1])})
    if worker and 'ERROR' not in worker:
        ids['worker_user_id'] = worker.split('\t')[0]
    if sp and 'ERROR' not in sp:
        ids['provider_id'] = int(sp.split('\t')[0])
        if ids.get('service_id'):
            ids['sp_service_id'] = ids['service_id']
    log('  资源: ' + json.dumps(ids, ensure_ascii=False))
    return ids


def expected_pool(payable):
    return round(float(payable) * FEE_RATE, 2)


def fetch_distributions(order_id, order_type):
    oid = str(order_id).replace("'", "''")
    ot = str(order_type).replace("'", "''")
    raw = mysql_q(
        f"SELECT beneficiary_role, IFNULL(beneficiary_user_id,''), commission_amount, "
        f"commission_pool, role_percentage FROM commission_distributions "
        f"WHERE order_id='{oid}' AND order_type='{ot}' ORDER BY beneficiary_role"
    )
    rows = []
    if not raw or 'ERROR' in raw:
        return rows
    for line in raw.splitlines():
        p = line.split('\t')
        if len(p) >= 5:
            rows.append({
                'role': p[0],
                'user_id': p[1] or None,
                'amount': float(p[2]),
                'pool': float(p[3]),
                'pct': float(p[4]),
            })
    return rows


def verify_commission(label, order_id, order_type, payable):
    sleep()
    pool_exp = expected_pool(payable)
    dists = fetch_distributions(order_id, order_type)
    if not dists:
        record(f'{label}-分佣记录', False, f'order={order_id} 无 commission_distributions')
        return
    pool = dists[0]['pool']
    total = round(sum(d['amount'] for d in dists), 2)
    promoter = next((d for d in dists if d['role'] == 'promoter'), None)
    pool_ok = abs(pool - pool_exp) < 0.02
    sum_ok = abs(total - pool) < 0.05
    prom_ok = promoter and str(promoter.get('user_id')) == PROMOTER_UID and promoter['amount'] > 0
    record(
        f'{label}-分佣池',
        pool_ok,
        f'pool={pool} expect={pool_exp} (payable={payable})'
    )
    record(
        f'{label}-分佣拆分',
        sum_ok and len(dists) >= 2,
        f'rows={len(dists)} total={total} pool={pool} detail={dists}'
    )
    record(
        f'{label}-推客到账',
        prom_ok,
        f"promoter_amt={promoter['amount'] if promoter else None} uid={promoter.get('user_id') if promoter else None}"
    )


def test_neighbor(token):
    log('\n--- 1/4 邻里帮帮 分佣 ---')
    payable = 100.0
    sleep()
    st, res = api('POST', '/neighbor-assist/orders', {
        'assist_type': 'take',
        'community_id': 1,
        'reward_amount': payable,
        'origin_address_snapshot': {'detail': '分佣测试A'},
        'destination_address_snapshot': {'detail': '分佣测试B'},
        'content': 'E2E分佣邻里帮帮',
        'contact_phone': PHONE,
    }, token)
    data = res.get('data') or res
    oid = data.get('id')
    if not oid:
        record('邻里帮帮-创建', False, str(res)[:200])
        return
    record('邻里帮帮-创建', True, f'id={oid} amount={data.get("amount")}')
    sleep()
    st2, pay = api('POST', f'/neighbor-assist/orders/{oid}/pay', {}, token)
    record('邻里帮帮-支付', st2 == 200 and pay.get('errno') == 0, str(pay)[:120])
    verify_commission('邻里帮帮', oid, 'neighbor_assist', payable)


def test_market(token, ids):
    log('\n--- 2/4 本地集市 分佣 ---')
    if not ids.get('goods_id'):
        record('集市-跳过', False, '无商品')
        return
    price = ids['goods_price']
    qty = max(1, int(100 / max(price, 1)))
    payable = round(price * qty, 2)
    items = [{'goods_id': ids['goods_id'], 'quantity': qty}]
    sleep()
    st, cre = api('POST', '/market/orders', {
        'shop_id': ids['shop_id'],
        'delivery_mode': 'express',
        'items': items,
        'address': {'name': '测试', 'phone': PHONE, 'province': '浙', 'city': '杭', 'district': '西', 'detail': '路1号'}
    }, token)
    cdata = cre.get('data') or cre
    ono = cdata.get('order_no') or cdata.get('orderNo')
    if not ono:
        record('集市-创建', False, str(cre)[:200])
        return
    record('集市-创建', True, f'order_no={ono} payable≈{payable}')
    sleep()
    st2, mock = api('POST', '/market/payments/mock-success', {'order_no': ono}, token)
    record('集市-支付', st2 == 200 and mock.get('code') == 0, str(mock)[:120])
    row = mysql_q(f"SELECT payable_amount, platform_fee_amount FROM market_orders WHERE order_no='{ono}'")
    if row and 'ERROR' not in row:
        parts = row.split('\t')
        payable = float(parts[0])
    verify_commission('集市', ono, 'market', payable)


def test_worker(token, ids):
    log('\n--- 3/4 直约技工 分佣 ---')
    sid = ids.get('service_id')
    wid = ids.get('worker_user_id')
    if not sid or not wid:
        record('技工-跳过', False, f'service={sid} worker={wid}')
        return
    payable = 100.0
    sleep()
    st, res = api('POST', '/service-orders', {
        'service_id': sid,
        'worker_id': wid,
        'community_id': 1,
        'group_key': 'tidy',
        'address': 'E2E分佣技工',
        'contact_name': '测试',
        'contact_phone': PHONE,
        'goods_price': payable,
        'qty': 1,
    }, token)
    data = res.get('data') or res
    oid = data.get('id')
    order_no = data.get('order_no')
    if not oid:
        record('技工-创建', False, str(res)[:200])
        return
    record('技工-创建', True, f'id={oid} pay={data.get("pay_amount")}')
    sleep()
    st2, pay = api('POST', f'/service-orders/{oid}/pay', {}, token)
    record('技工-支付', st2 == 200 and pay.get('errno') == 0, str(pay)[:120])
    verify_commission('技工', order_no or oid, 'service', payable)


def test_sp(token, ids):
    log('\n--- 4/4 直约服务商 分佣 ---')
    pid = ids.get('provider_id')
    sp_sid = ids.get('sp_service_id')
    if not pid or not sp_sid:
        record('服务商-跳过', False, f'provider={pid} service={sp_sid}')
        return
    sleep()
    st, res = api('POST', '/service-orders/bundle', {
        'provider_id': pid,
        'community_id': 1,
        'items': [{'service_id': sp_sid, 'qty': 1}],
        'address': 'E2E分佣服务商',
        'contact_name': '测试',
        'contact_phone': PHONE,
    }, token)
    data = res.get('data') or res
    oid = data.get('id')
    order_no = data.get('order_no')
    payable = float(data.get('amount') or 0)
    if not oid:
        record('服务商-创建', False, str(res)[:200])
        return
    record('服务商-创建', True, f'id={oid} amount={payable}')
    sleep()
    st2, pay = api('POST', f'/service-orders/{oid}/pay', {}, token)
    record('服务商-支付', st2 == 200 and pay.get('errno') == 0, str(pay)[:120])
    verify_commission('服务商', order_no or oid, 'service', payable)


def verify_promoter_api(token):
    log('\n--- 推客佣金 API ---')
    # 推客用 buyer token 无法查推客记录；用 DB 校验余额增量即可
    bal = mysql_q(
        f"SELECT pending_amount, total_earned FROM partner_commission_balances "
        f"WHERE user_id={PROMOTER_UID} AND role='promoter' LIMIT 1"
    )
    record('推客余额', bool(bal and 'ERROR' not in bal and float(bal.split('\t')[0]) > 0),
           bal or '无余额行')


def main():
    log('=== 推广分佣 E2E（单线程）===')
    deploy_fixes()
    setup_commission_chain()
    ids = discover_ids()
    token = login()
    log(f'买家登录 OK uid={BUYER_UID} 推客={PROMOTER_UID}')

    test_neighbor(token)
    test_market(token, ids)
    test_worker(token, ids)
    test_sp(token, ids)
    verify_promoter_api(token)

    log('\n=== 汇总 ===')
    passed = sum(1 for r in results if r['ok'])
    failed = [r for r in results if not r['ok']]
    log(f'通过 {passed}/{len(results)}')
    for r in failed:
        log(f"  FAIL: {r['name']} -> {r['detail']}")
    sys.exit(0 if not failed else 1)


if __name__ == '__main__':
    main()
