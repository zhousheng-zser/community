"""多用户数据隔离：profile/订单/优惠券/足迹/帖子 交叉验证"""
import json, ssl, urllib.request, urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://jshsp1.eds-tech.cn/api/v1'

def post(path, body):
    r = urllib.request.Request(BASE + path, json.dumps(body).encode(), {'Content-Type': 'application/json'}, method='POST')
    try:
        return json.loads(urllib.request.urlopen(r, context=ctx, timeout=15).read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

def get(path, token):
    r = urllib.request.Request(BASE + path, headers={'Authorization': 'Bearer ' + token})
    return json.loads(urllib.request.urlopen(r, context=ctx, timeout=15).read().decode())

def login(phone):
    b = post('/auth/login_sms', {'phone': phone, 'code': '024680'})
    tok = b.get('token')
    user = b.get('user') or {}
    return tok, user

def extract_list(payload):
    if not payload:
        return []
    d = payload.get('data') if isinstance(payload, dict) else payload
    if isinstance(d, list):
        return d
    if isinstance(d, dict):
        for k in ('list', 'rows', 'orders', 'items'):
            if isinstance(d.get(k), list):
                return d[k]
    if isinstance(payload, dict):
        for k in ('list', 'rows'):
            if isinstance(payload.get(k), list):
                return payload[k]
    return []

PHONES = ['13800001111', '15267619061', '13800000000']
sessions = []
for ph in PHONES:
    tok, user = login(ph)
    if not tok:
        print('LOGIN FAIL', ph)
        continue
    prof = get('/user/profile', tok)
    pd = prof.get('data') or prof
    coupons = extract_list(get('/coupons/my', tok))
    svc_orders = extract_list(get('/service-orders/my?page=1&limit=5', tok))
    mkt_orders = extract_list(get('/market/orders?page=1&page_size=5', tok))
    footprints = []
    try:
        footprints = extract_list(get('/user/footprints?page=1&limit=5', tok))
    except Exception as ex:
        footprints = []
        print('  footprints skip:', ex)
    my_posts = extract_list(get('/posts/my/published?page=1&limit=5', tok))
    sessions.append({
        'phone': ph,
        'token': tok,
        'login_id': str(user.get('id')),
        'profile_id': str(pd.get('id')),
        'nickname': pd.get('nickname'),
        'coupons': len(coupons),
        'svc_orders': len(svc_orders),
        'mkt_orders': len(mkt_orders),
        'footprints': len(footprints),
        'my_posts': len(my_posts),
        'coupon_ids': [c.get('id') for c in coupons[:3]],
        'svc_order_ids': [o.get('id') for o in svc_orders[:3]],
    })

print('=== per-user data ===')
for s in sessions:
    ok = s['login_id'] == s['profile_id']
    print(json.dumps({k: v for k, v in s.items() if k != 'token'}, ensure_ascii=False))
    print('  profile match:', ok)

if len(sessions) >= 2:
    a, b = sessions[0], sessions[1]
    # cross token test
    pa = get('/user/profile', b['token'])
    pb = get('/user/profile', a['token'])
    cross_a = (pa.get('data') or pa).get('id')
    cross_b = (pb.get('data') or pb).get('id')
    print('\n=== cross token ===')
    print('A token -> profile id', cross_b, 'expect', a['profile_id'], 'OK' if str(cross_b)==a['profile_id'] else 'FAIL')
    print('B token -> profile id', cross_a, 'expect', b['profile_id'], 'OK' if str(cross_a)==b['profile_id'] else 'FAIL')

    # overlap check
    if set(a.get('coupon_ids') or []) & set(b.get('coupon_ids') or []):
        print('WARN: coupon id overlap between users')
    if set(a.get('svc_order_ids') or []) & set(b.get('svc_order_ids') or []):
        print('WARN: service order id overlap between users')

print('\nDONE')
