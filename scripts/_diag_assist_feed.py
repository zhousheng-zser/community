"""诊断邻里互动帮帮订单池"""
import json, ssl, urllib.request, paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def req(method, path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
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

# DB
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command(
    "MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
    "\"SELECT id,user_id,community_id,status,pay_status,LEFT(remark,30) remark,created_at "
    "FROM neighbor_assist_orders ORDER BY id DESC LIMIT 10;\"",
    timeout=15
)
print('=== DB neighbor_assist_orders (latest 10) ===')
print(o.read().decode('utf-8', 'replace'))

for phone in ['13800001111', '15267619061']:
    tok, user = login(phone)
    uid = str(user.get('id', ''))
    st, prof = req('GET', '/user/profile', token=tok)
    pd = prof.get('data') or prof
    cid = pd.get('community_id') or pd.get('communityId')
    print(f'\n=== {phone} uid={uid} community_id={cid} ===')
    st, pool = req('GET', '/neighbor-assist/orders/community-pool?page=1&limit=12', token=tok)
    print('community-pool HTTP', st, json.dumps(pool, ensure_ascii=False)[:600])
    st2, my = req('GET', '/neighbor-assist/orders/my?role=publisher&limit=5', token=tok)
    d = my.get('data') or my
    lst = d.get('list') if isinstance(d, dict) else []
    print('my publisher:', len(lst or []), 'orders')
    for row in (lst or [])[:3]:
        print(' ', row.get('id'), row.get('status'), row.get('pay_status'), (row.get('remark') or '')[:30])

c.close()
