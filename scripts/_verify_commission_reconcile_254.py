#!/usr/bin/env python3
"""254 只读对账：平台抽成字段 vs 推广分佣池（单线程，禁止并发写）"""
import json
import sys
import time

try:
    import paramiko
except ImportError:
    print('pip install paramiko')
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '8.140.204.254'
USER = 'root'
DB = 'community_benefit'
SLEEP = 2


def ssh_mysql(sql):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, timeout=20)
    cmd = f"mysql -N -B -e \"USE {DB}; {sql}\""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    client.close()
    if err and 'Warning' not in err:
        raise RuntimeError(err or 'mysql error')
    return out


def q(sql):
    raw = ssh_mysql(sql)
    if not raw:
        return []
    rows = []
    for line in raw.splitlines():
        rows.append(line.split('\t'))
    return rows


def num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def main():
    print('=== 平台抽成 / 分佣只读对账 (254) ===')
    time.sleep(SLEEP)

    cfg = q("SELECT config_key, config_value FROM system_configs WHERE config_key LIKE 'platform.fee_rate%'")
    print('\n[配置]')
    for k, v in cfg:
        print(f'  {k} = {v}')

    time.sleep(SLEEP)
    tables = [
        ('market_orders', 'order_no', 'payable_amount', 'market'),
        ('service_orders', 'order_no', 'COALESCE(pay_amount, amount)', 'service'),
        ('neighbor_assist_orders', 'id', 'amount', 'neighbor_assist'),
    ]
    issues = []

    for tbl, id_col, amt_expr, otype in tables:
        time.sleep(SLEEP)
        sql = f"""
        SELECT {id_col}, {amt_expr}, platform_fee_rate, platform_fee_amount, settlement_amount, pay_status, status
        FROM {tbl}
        WHERE pay_status = 'paid' OR status IN ('completed','pending_confirm')
        ORDER BY id DESC LIMIT 20
        """
        rows = q(sql)
        print(f'\n[{tbl}] 最近 {len(rows)} 条已付/完成')
        for r in rows:
            oid, payable, rate, fee, settle, pay_st, st = (r + [''] * 7)[:7]
            payable_n = num(payable)
            fee_n = num(fee)
            settle_n = num(settle)
            expect_fee = round(payable_n * num(rate, 0.1), 2)
            expect_settle = round(max(payable_n - expect_fee, 0), 2)
            ok_fee = abs(fee_n - expect_fee) < 0.02 or payable_n == 0
            ok_settle = abs(settle_n - expect_settle) < 0.02 or payable_n == 0
            flag = 'OK' if ok_fee and ok_settle else 'MISMATCH'
            if flag != 'OK':
                issues.append((tbl, oid, payable_n, fee_n, expect_fee, settle_n, expect_settle))
            print(f'  {oid} payable={payable_n} fee={fee_n}(exp {expect_fee}) settle={settle_n}(exp {expect_settle}) [{flag}]')

    time.sleep(SLEEP)
    comm = q("""
    SELECT order_type, order_id, order_amount, commission_pool, SUM(commission_amount) AS comm_sum, COUNT(*) AS cnt
    FROM commission_distributions
    WHERE status <> 'refunded'
    GROUP BY order_type, order_id, order_amount, commission_pool
    ORDER BY MAX(created_at) DESC
    LIMIT 30
    """)
    print(f'\n[commission_distributions] 最近 {len(comm)} 组订单')
    for r in comm:
        otype, oid, gmv, pool, comm_sum, cnt = (r + [''] * 6)[:6]
        print(f'  {otype}:{oid} gmv={gmv} pool={pool} comm={comm_sum} rows={cnt}')

    time.sleep(SLEEP)
    summary = q("""
    SELECT COUNT(DISTINCT CONCAT(order_type,':',order_id)) AS orders,
           ROUND(SUM(DISTINCT order_amount),2) AS gmv_dup,
           ROUND(SUM(commission_amount),2) AS total_comm
    FROM commission_distributions WHERE status <> 'refunded'
    """)
    if summary:
        print('\n[汇总]', summary[0])

    print('\n=== 结果 ===')
    if issues:
        print(f'发现 {len(issues)} 条抽成字段不一致（历史单 fee=0 可忽略）')
        for it in issues[:10]:
            print(' ', it)
    else:
        print('抽成字段校验通过（抽样）')
    print('完成（只读，未写 API）')


if __name__ == '__main__':
    main()
