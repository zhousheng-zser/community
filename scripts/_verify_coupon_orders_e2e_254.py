#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
254 单线程优惠券 + 订单 E2E（禁止并发写）
覆盖：邻里帮帮 / 本地集市 / 直约技工 / 直约服务商
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
UID = '313949215099195408'
SLEEP = 3  # 写操作间隔（秒）
REMOTE_BACKEND = '/root/community-backend/backend'

LOCAL_FILES = [
    ('backend/src/services/platformFee.service.js',
     f'{REMOTE_BACKEND}/src/services/platformFee.service.js'),
    ('backend/src/controllers/neighborAssistController.js',
     f'{REMOTE_BACKEND}/src/controllers/neighborAssistController.js'),
    ('backend/src/controllers/serviceOrderController.js',
     f'{REMOTE_BACKEND}/src/controllers/serviceOrderController.js'),
    ('backend/src/modules/coupon/services/coupon.service.js',
     f'{REMOTE_BACKEND}/src/modules/coupon/services/coupon.service.js'),
    ('backend/src/modules/market/controllers/market.controller.js',
     f'{REMOTE_BACKEND}/src/modules/market/controllers/market.controller.js'),
    ('backend/scripts/ensure-points-column.js',
     f'{REMOTE_BACKEND}/scripts/ensure-points-column.js'),
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


def mysql(q):
    c = ssh()
    cmd = f"MYSQL_PWD='CommunityPwd123!' mysql -N -B -uroot community_db -e \"{q.replace(chr(34), chr(92)+chr(34))}\" 2>&1"
    _, o, e = c.exec_command(cmd, timeout=30)
    out = (o.read() + e.read()).decode('utf-8', 'replace').strip()
    c.close()
    return out


def deploy_files():
    log('=== 部署优惠券相关控制器 ===')
    c = ssh()
    sftp = c.open_sftp()
    import os
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for local_rel, remote in LOCAL_FILES:
        local = os.path.join(root, local_rel.replace('/', os.sep))
        sftp.put(local, remote)
        log(f'  uploaded {local_rel}')
    sftp.close()
    _, o, e = c.exec_command(
        f'mkdir -p {REMOTE_BACKEND}/src/services {REMOTE_BACKEND}/scripts && '
        'cd /root/community-backend/backend && pm2 restart community-benefit-api 2>&1 | tail -8',
        timeout=40
    )
    log((o.read() + e.read()).decode('utf-8', 'replace'))
    c.close()
    sleep()
    log('  等待 API 就绪...')
    time.sleep(15)


def ensure_points_columns():
    log('=== 补齐 points / points_earned 列 ===')
    alters = [
        'ALTER TABLE users ADD COLUMN points INT NOT NULL DEFAULT 0',
        'ALTER TABLE market_orders ADD COLUMN points_earned INT UNSIGNED NOT NULL DEFAULT 0',
        'ALTER TABLE service_orders ADD COLUMN points_earned INT UNSIGNED NOT NULL DEFAULT 0',
        'ALTER TABLE neighbor_assist_orders ADD COLUMN points_earned INT UNSIGNED NOT NULL DEFAULT 0',
    ]
    c = ssh()
    for sql in alters:
        cmd = f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e \"{sql}\" 2>&1"
        _, o, e = c.exec_command(cmd, timeout=20)
        out = (o.read() + e.read()).decode('utf-8', 'replace').strip()
        if out and 'Duplicate column' not in out:
            log(f'  {sql.split()[2]}: {out[:120]}')
    c.close()
    sleep()


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
    for attempt in range(12):
        st, res = api('POST', '/auth/login_sms', {'phone': PHONE, 'code': SMS_CODE})
        tok = res.get('token') or (res.get('data') or {}).get('token')
        if tok:
            return tok
        if st in (502, 503, 504):
            log(f'  登录重试 {attempt + 1}/12 (HTTP {st})...')
            time.sleep(5)
            continue
        raise RuntimeError(f'登录失败 {st} {res}')
    raise RuntimeError('登录失败：API 持续 502')


def apply_coupon_migration():
    log('=== 检查/执行 DB 迁移 ===')
    import os
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_files = [
        '0443_coupon_issue_mode.sql',
        '0444_platform_fee.sql',
    ]
    create_cfg = """
CREATE TABLE IF NOT EXISTS system_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value VARCHAR(500) DEFAULT '',
  config_type ENUM('decimal','integer','string','json') DEFAULT 'string',
  description VARCHAR(500) DEFAULT NULL,
  is_public TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
    c = ssh()
    cmd0 = f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db 2>&1 <<'EOSQL'\n{create_cfg}\nEOSQL"
    _, o0, e0 = c.exec_command(cmd0, timeout=30)
    out0 = (o0.read() + e0.read()).decode('utf-8', 'replace')
    if 'ERROR' in out0:
        log('  system_configs: ' + out0[:200])
    sftp = c.open_sftp()
    try:
        sftp.mkdir(f'{REMOTE_BACKEND}/sql')
    except OSError:
        pass
    for fn in sql_files:
        local = os.path.join(root, 'backend', 'sql', fn)
        remote = f'{REMOTE_BACKEND}/sql/{fn}'
        if os.path.isfile(local):
            sftp.put(local, remote)
            _, o, e = c.exec_command(f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db < {remote} 2>&1", timeout=40)
            out = (o.read() + e.read()).decode('utf-8', 'replace')
            if out.strip() and 'Duplicate column' not in out and 'ERROR' in out:
                log(f'  {fn}: ' + out[:200])
            else:
                log(f'  {fn} OK')
    sftp.close()
    c.close()
    sleep()


def setup_test_coupons():
    """SQL 创建模板并发放 4 张测试券（单线程）"""
    log('=== 准备测试优惠券 ===')
    sql = f"""
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,apply_scope,status,issue_mode,total_count,issued_count,per_user_limit,show_on_home,created_at,updated_at)
SELECT 'E2E_ALL_5','E2E全品类5元','cash',5,20,'all','active','claim',0,0,50,0,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='E2E_ALL_5' LIMIT 1);
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,apply_scope,status,issue_mode,total_count,issued_count,per_user_limit,show_on_home,created_at,updated_at)
SELECT 'E2E_MKT_5','E2E集市5元','cash',5,20,'market','active','claim',0,0,50,0,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='E2E_MKT_5' LIMIT 1);
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,apply_scope,status,issue_mode,total_count,issued_count,per_user_limit,show_on_home,created_at,updated_at)
SELECT 'E2E_SVC_W','E2E技工5元','cash',5,20,'service','active','claim',0,0,50,0,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='E2E_SVC_W' LIMIT 1);
INSERT INTO coupon_templates (code,name,type,discount_amount,threshold_amount,apply_scope,status,issue_mode,total_count,issued_count,per_user_limit,show_on_home,created_at,updated_at)
SELECT 'E2E_SVC_SP','E2E服务商5元','cash',5,20,'service','active','claim',0,0,50,0,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code='E2E_SVC_SP' LIMIT 1);

INSERT INTO coupon_issues (template_id,user_id,code,status,issue_source,issued_at,created_at,updated_at)
SELECT t.id, {UID}, CONCAT(t.code,'-',UNIX_TIMESTAMP()), 'unused', 'e2e_test', NOW(), NOW(), NOW()
FROM coupon_templates t WHERE t.code='E2E_ALL_5' ORDER BY t.id DESC LIMIT 1;
INSERT INTO coupon_issues (template_id,user_id,code,status,issue_source,issued_at,created_at,updated_at)
SELECT t.id, {UID}, CONCAT(t.code,'-',UNIX_TIMESTAMP()), 'unused', 'e2e_test', NOW(), NOW(), NOW()
FROM coupon_templates t WHERE t.code='E2E_MKT_5' ORDER BY t.id DESC LIMIT 1;
INSERT INTO coupon_issues (template_id,user_id,code,status,issue_source,issued_at,created_at,updated_at)
SELECT t.id, {UID}, CONCAT(t.code,'-',UNIX_TIMESTAMP()), 'unused', 'e2e_test', NOW(), NOW(), NOW()
FROM coupon_templates t WHERE t.code='E2E_SVC_W' ORDER BY t.id DESC LIMIT 1;
INSERT INTO coupon_issues (template_id,user_id,code,status,issue_source,issued_at,created_at,updated_at)
SELECT t.id, {UID}, CONCAT(t.code,'-',UNIX_TIMESTAMP()), 'unused', 'e2e_test', NOW(), NOW(), NOW()
FROM coupon_templates t WHERE t.code='E2E_SVC_SP' ORDER BY t.id DESC LIMIT 1;
"""
    c = ssh()
    cmd = f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db 2>&1 <<'EOSQL'\n{sql}\nEOSQL"
    _, o, e = c.exec_command(cmd, timeout=40)
    out = (o.read() + e.read()).decode('utf-8', 'replace')
    c.close()
    if 'ERROR' in out:
        raise RuntimeError('发券 SQL 失败: ' + out[-500:])
    sleep()

    rows = mysql(
        f"SELECT t.code, i.id, t.id FROM coupon_issues i "
        f"JOIN coupon_templates t ON i.template_id=t.id "
        f"WHERE i.user_id={UID} AND i.issue_source='e2e_test' AND i.status='unused' "
        f"ORDER BY i.id DESC LIMIT 4"
    )
    coupons = {}
    for line in rows.splitlines():
        parts = line.split('\t')
        if len(parts) >= 2:
            coupons[parts[0]] = {'issue_id': int(parts[1]), 'template_id': int(parts[2]) if len(parts) > 2 else 0}
    need = {'E2E_ALL_5', 'E2E_MKT_5', 'E2E_SVC_W', 'E2E_SVC_SP'}
    if not need.issubset(coupons.keys()):
        raise RuntimeError('发券不完整: ' + str(coupons))
    log('  ' + json.dumps({k: v['issue_id'] for k, v in coupons.items()}, ensure_ascii=False))
    return coupons


def coupon_status(issue_id):
    row = mysql(f"SELECT status, order_type, order_ref FROM coupon_issues WHERE id={issue_id}")
    if not row or 'ERROR' in row:
        return None
    parts = row.split('\t')
    return {'status': parts[0], 'order_type': parts[1] if len(parts) > 1 else '', 'order_ref': parts[2] if len(parts) > 2 else ''}


def discover_ids():
    log('=== 探测测试资源 ID ===')
    goods = mysql('SELECT id, shop_id, price, name FROM merchant_goods WHERE status="on_sale" AND is_published=1 LIMIT 1')
    svc = mysql('SELECT id, price, title FROM services WHERE is_published=1 ORDER BY id LIMIT 1')
    sp_svc = mysql('SELECT id, provider_id, price FROM service_items WHERE status="on_sale" OR is_published=1 LIMIT 1')
    if not sp_svc or 'ERROR' in sp_svc:
        sp_svc = mysql('SELECT id, provider_id, price FROM service_items LIMIT 1')
    worker = mysql(f'SELECT user_id FROM worker_profiles WHERE status="active" AND community_id=1 AND user_id != {UID} LIMIT 1')
    if not worker or 'ERROR' in worker:
        worker = mysql(f'SELECT user_id FROM worker_profiles WHERE status="active" AND community_id=1 LIMIT 1')
    sp = mysql('SELECT id FROM service_provider_profiles WHERE status="active" AND community_id=1 LIMIT 1')

    ids = {}
    if goods and 'ERROR' not in goods:
        g = goods.split('\t')
        ids['goods_id'] = int(g[0])
        ids['shop_id'] = int(g[1])
        ids['goods_price'] = float(g[2])
    if svc and 'ERROR' not in svc:
        s = svc.split('\t')
        ids['service_id'] = int(s[0])
        ids['service_price'] = float(s[1])
    if sp and 'ERROR' not in sp:
        ids['provider_id'] = int(sp.split('\t')[0])
    if sp_svc and 'ERROR' not in sp_svc:
        p = sp_svc.split('\t')
        ids['sp_service_id'] = int(p[0])
        ids['provider_id'] = int(p[1])
        ids['sp_price'] = float(p[2])
    elif ids.get('service_id') and ids.get('provider_id'):
        ids['sp_service_id'] = ids['service_id']
        ids['sp_price'] = ids.get('service_price', 99)
    if worker and 'ERROR' not in worker:
        ids['worker_user_id'] = worker.split('\t')[0]
    if sp and 'ERROR' not in sp:
        ids['provider_id'] = int(sp.split('\t')[0])
    log('  ' + json.dumps(ids, ensure_ascii=False))
    return ids


def record(name, ok, detail):
    results.append({'name': name, 'ok': ok, 'detail': detail})
    mark = 'PASS' if ok else 'FAIL'
    log(f'[{mark}] {name}: {detail}')


def test_neighbor_assist(token, issue_id, ids):
    log('\n--- 1/4 邻里帮帮 + 优惠券 ---')
    sleep()
    body = {
        'assist_type': 'take',
        'community_id': 1,
        'reward_amount': 50,
        'origin_address_snapshot': {'detail': 'A栋1单元'},
        'destination_address_snapshot': {'detail': 'B栋2单元'},
        'content': 'E2E券测试邻里帮帮',
        'contact_phone': PHONE,
        'coupon_issue_id': issue_id
    }
    st, res = api('POST', '/neighbor-assist/orders', body, token)
    data = res.get('data') or res
    oid = data.get('id') or data.get('order_id')
    amt = float(data.get('amount') or 0)
    disc = float(data.get('discount_amount') or 0)
    if st != 200 or not oid:
        record('邻里帮帮-创建', False, f'HTTP {st} {res}')
        return
    record('邻里帮帮-创建', amt == 45 and disc == 5, f'order={oid} amount={amt} discount={disc}')

    sleep()
    st2, pay = api('POST', f'/neighbor-assist/orders/{oid}/pay', {}, token)
    pay_ok = st2 == 200 and (pay.get('errno') == 0 or pay.get('data'))
    record('邻里帮帮-支付', pay_ok, str(pay)[:200])

    sleep()
    cs = coupon_status(issue_id)
    record('邻里帮帮-券核销', cs and cs['status'] == 'used' and cs['order_type'] == 'neighbor_assist',
           str(cs))


def test_market(token, issue_id, ids):
    log('\n--- 2/4 本地集市 + 优惠券 ---')
    if not ids.get('goods_id'):
        record('集市-跳过', False, '无可用商品')
        return
    qty = max(1, int(25 / max(ids.get('goods_price', 25), 1)))
    items = [{'goods_id': ids['goods_id'], 'quantity': qty}]
    sleep()
    st, prev = api('POST', '/market/orders/preview', {
        'shop_id': ids['shop_id'],
        'items': items,
        'coupon_issue_id': issue_id
    }, token)
    pdata = prev.get('data') or prev
    if prev.get('code') not in (0, None) and prev.get('errno') not in (0, None):
        record('集市-预览', False, str(prev)[:220])
        return
    disc = float(pdata.get('discount_amount') or 0)
    payable = float(pdata.get('payable_amount') or 0)
    record('集市-预览', st == 200 and disc >= 5, f'discount={disc} payable={payable}')

    sleep()
    st2, cre = api('POST', '/market/orders', {
        'shop_id': ids['shop_id'],
        'delivery_mode': 'express',
        'items': items,
        'coupon_issue_id': issue_id,
        'address': {'name': '测试', 'phone': PHONE, 'province': '浙', 'city': '杭', 'district': '西', 'detail': '路1号'}
    }, token)
    cdata = cre.get('data') or cre
    ono = cdata.get('order_no') or cdata.get('orderNo')
    record('集市-创建', st2 == 200 and ono, f'order_no={ono} {str(cre)[:180]}')
    if not ono:
        return

    sleep()
    st3, mock = api('POST', '/market/payments/mock-success', {'order_no': ono}, token)
    record('集市-支付', st3 == 200 and (mock.get('code') == 0 or mock.get('errno') == 0), str(mock)[:180])

    sleep()
    cs = coupon_status(issue_id)
    record('集市-券核销', cs and cs['status'] == 'used' and cs['order_type'] == 'market', str(cs))


def test_worker_direct(token, issue_id, ids):
    log('\n--- 3/4 直约技工 + 优惠券 ---')
    sid = ids.get('service_id')
    wid = ids.get('worker_user_id') or UID
    if not sid:
        record('技工-跳过', False, '无可用 service_id')
        return
    price = max(99, ids.get('service_price', 99))
    sleep()
    body = {
        'service_id': sid,
        'worker_id': wid,
        'community_id': 1,
        'group_key': 'tidy',
        'address': 'E2E技工测试地址',
        'contact_name': '测试',
        'contact_phone': PHONE,
        'goods_price': price,
        'qty': 1,
        'coupon_issue_id': issue_id
    }
    st, res = api('POST', '/service-orders', body, token)
    data = res.get('data') or res
    oid = data.get('id') or data.get('order_id')
    pay_amt = float(data.get('pay_amount') or data.get('amount') or 0)
    disc = float(data.get('discount_amount') or 0)
    expect = price - 5
    record('技工-创建', st == 200 and oid and abs(pay_amt - expect) < 0.02 and disc == 5,
           f'order={oid} pay={pay_amt} discount={disc} res={str(res)[:180]}')
    if not oid:
        return

    sleep()
    st2, pay = api('POST', f'/service-orders/{oid}/pay', {}, token)
    record('技工-支付', st2 == 200 and (pay.get('errno') == 0 or pay.get('data')), str(pay)[:180])

    sleep()
    cs = coupon_status(issue_id)
    record('技工-券核销', cs and cs['status'] == 'used' and cs['order_type'] == 'service', str(cs))


def test_sp_bundle(token, issue_id, ids):
    log('\n--- 4/4 直约服务商 + 优惠券 ---')
    pid = ids.get('provider_id')
    sp_sid = ids.get('sp_service_id')
    if not pid or not sp_sid:
        record('服务商-跳过', False, f'provider={pid} sp_service={sp_sid}')
        return
    sleep()
    body = {
        'provider_id': pid,
        'community_id': 1,
        'items': [{'service_id': sp_sid, 'qty': 1}],
        'address': 'E2E服务商测试地址',
        'contact_name': '测试',
        'contact_phone': PHONE,
        'coupon_issue_id': issue_id
    }
    st, res = api('POST', '/service-orders/bundle', body, token)
    data = res.get('data') or res
    oid = data.get('id')
    amt = float(data.get('amount') or 0)
    disc = float(data.get('discount_amount') or 0)
    record('服务商-创建', st == 200 and oid and disc >= 5, f'order={oid} amount={amt} discount={disc} body={str(res)[:200]}')
    if not oid:
        return

    sleep()
    st2, pay = api('POST', f'/service-orders/{oid}/pay', {}, token)
    record('服务商-支付', st2 == 200 and (pay.get('errno') == 0 or pay.get('data')), str(pay)[:180])

    sleep()
    cs = coupon_status(issue_id)
    record('服务商-券核销', cs and cs['status'] == 'used' and cs['order_type'] == 'service', str(cs))


def main():
    log('=== 优惠券订单 E2E（单线程）===')
    deploy_files()
    apply_coupon_migration()
    ensure_points_columns()
    coupons = setup_test_coupons()
    ids = discover_ids()
    token = login()
    log(f'登录成功 uid={UID}')

    test_neighbor_assist(token, coupons['E2E_ALL_5']['issue_id'], ids)
    test_market(token, coupons['E2E_MKT_5']['issue_id'], ids)
    test_worker_direct(token, coupons['E2E_SVC_W']['issue_id'], ids)
    test_sp_bundle(token, coupons['E2E_SVC_SP']['issue_id'], ids)

    log('\n=== 汇总 ===')
    passed = sum(1 for r in results if r['ok'])
    failed = [r for r in results if not r['ok']]
    log(f'通过 {passed}/{len(results)}')
    for r in failed:
        log(f"  FAIL: {r['name']} -> {r['detail']}")
    sys.exit(0 if not failed else 1)


if __name__ == '__main__':
    main()
