"""验证 community-pool 能否看到他人帮帮订单"""
import json, ssl, urllib.request, paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def req(method, path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def login(phone):
    st, b = req('POST', '/auth/login_sms', {'phone': phone, 'code': '024680'})
    tok = b.get('token') or (b.get('data') or {}).get('token')
    user = b.get('user') or (b.get('data') or {}).get('user') or {}
    return tok, user

def pool_list(token):
    st, body = req('GET', '/neighbor-assist/orders/community-pool?page=1&limit=20', token=token)
    d = body.get('data') if isinstance(body, dict) else body
    lst = (d.get('list') if isinstance(d, dict) else None) or []
    return st, lst

print('=== community-pool 可见性验证 ===\n')

# 发布者 vs 邻居
publisher_phone = '13800000000'
neighbor_phones = ['13800001111', '15267619061']

pub_tok, pub_user = login(publisher_phone)
pub_uid = str(pub_user.get('id', ''))
st, pub_pool = pool_list(pub_tok)
print(f'【发布者 {publisher_phone}】uid={pub_uid}')
print(f'  community-pool: HTTP {st}, 条数={len(pub_pool)} (预期 0，不含自己发的单)')

st2, my_body = req('GET', '/neighbor-assist/orders/my?role=publisher&limit=5', token=pub_tok)
my_list = ((my_body.get('data') or {}).get('list') or [])
my_paid = [x for x in my_list if x.get('pay_status') == 'paid' and x.get('status') == 'paid_pending_dispatch']
print(f'  我的已支付待接单: {len(my_paid)} 条 -> ids={[x.get("id") for x in my_paid]}')

for ph in neighbor_phones:
    tok, user = login(ph)
    uid = str(user.get('id', ''))
    st, prof = req('GET', '/user/profile', token=tok)
    pd = prof.get('data') or prof
    cid = pd.get('community_id') or pd.get('communityId')
    st, lst = pool_list(tok)
    ids = [x.get('id') for x in lst]
    pubs = [str((x.get('publisher') or {}).get('id', '')) for x in lst[:5]]
    print(f'\n【邻居 {ph}】uid={uid} community_id={cid}')
    print(f'  community-pool: HTTP {st}, 条数={len(lst)}')
    if lst:
        print(f'  前几条 id={ids[:5]}, 发布者={pubs[:5]}')
        sees_publisher = any(str(p) == pub_uid for p in pubs)
        print(f'  能看到发布者({pub_uid})的单: {"是" if sees_publisher else "否"}')
    else:
        print('  ⚠ 看不到任何帮帮单')

# 未登录
st, body = req('GET', '/neighbor-assist/orders/community-pool?page=1&limit=5')
print(f'\n【未登录】HTTP {st} (预期 401)')

# DB 统计
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command(
    "MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -N -e "
    "\"SELECT COUNT(*) FROM neighbor_assist_orders WHERE status='paid_pending_dispatch' AND pay_status='paid' AND assigned_worker_id IS NULL AND community_id=1;\"",
    timeout=15
)
eligible = o.read().decode().strip()
_, o2, _ = c.exec_command(
    "MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -N -e "
    "\"SELECT COUNT(*) FROM neighbor_assist_orders WHERE status='paid_pending_dispatch' AND pay_status='paid' AND assigned_worker_id IS NULL AND community_id=1 AND user_id IS NOT NULL;\"",
    timeout=15
)
with_user = o2.read().decode().strip()
c.close()
print(f'\n【DB】community_id=1 可展示订单: {eligible} 条 (user_id 非空: {with_user} 条)')
