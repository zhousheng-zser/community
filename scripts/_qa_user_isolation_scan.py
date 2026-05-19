"""测试视角：多用户登录后各业务接口隔离与边界用例"""
import json, ssl, urllib.request, urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'
ISSUES = []

def post(path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:300]}

def get(path, token=None):
    headers = {}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request(BASE + path, headers=headers, method='GET')
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:300]}

def login(phone):
    st, b = post('/auth/login_sms', {'phone': phone, 'code': '024680'})
    tok = b.get('token')
    user = b.get('user') or {}
    return tok, user, st, b

def list_from(payload):
    if not payload:
        return []
    d = payload.get('data') if isinstance(payload, dict) else payload
    if isinstance(d, list):
        return d
    if isinstance(d, dict):
        for k in ('list', 'rows', 'orders', 'items', 'data'):
            v = d.get(k)
            if isinstance(v, list):
                return v
    if isinstance(payload, dict):
        for k in ('list', 'rows'):
            if isinstance(payload.get(k), list):
                return payload[k]
    return []

print('=== QA 多用户隔离扫描 ===\n')
phones = ['13800001111', '15267619061', '13800000000']
sessions = []
for ph in phones:
    tok, user, st, body = login(ph)
    if not tok:
        ISSUES.append(f'[P0] {ph} 无法登录: {body.get("msg")}')
        continue
    uid = str(user.get('id'))
    prof_st, prof = get('/user/profile', tok)
    pd = prof.get('data') or prof
    pid = str(pd.get('id', ''))
    if uid != pid:
        ISSUES.append(f'[P0] {ph} login_id={uid} profile_id={pid} 不一致')

    endpoints = [
        ('coupons/my', '/coupons/my?page=1&page_size=20'),
        ('market/orders', '/market/orders?page=1&page_size=10'),
        ('service-orders/my', '/service-orders/my?page=1&limit=10'),
        ('posts/my/published', '/posts/my/published?page=1&limit=5'),
        ('user/addresses', '/user/addresses'),
        ('user/footprints', '/user/footprints?page=1&limit=5'),
        ('user/invite-code', '/user/invite-code'),
        ('promoter/commission', '/promoter/commission'),
        ('wx/user/coupon/' + uid, f'/wx/user/coupon/{uid}'),
    ]
    ep_data = {}
    for name, path in endpoints:
        st2, body2 = get(path, tok)
        ep_data[name] = {'status': st2, 'count': len(list_from(body2)), 'body': body2}
        if st2 >= 500:
            ISSUES.append(f'[P1] {ph} {name} HTTP {st2}')
        if name.startswith('wx/user/coupon/') and st2 == 403:
            ISSUES.append(f'[P1] {ph} 旧版优惠券接口 403（应用自身 userId 访问被拒）')

    sessions.append({'phone': ph, 'uid': uid, 'token': tok, 'endpoints': ep_data})
    print(f'{ph} uid={uid} profile_ok={uid==pid}')

# 交叉：A 的 token 不能读到 B 的订单详情（若有 id）
if len(sessions) >= 2:
    a, b = sessions[0], sessions[1]
    # legacy coupon path with wrong id
    st, body = get(f'/wx/user/coupon/{b["uid"]}', a['token'])
    if st == 200:
        ISSUES.append(f'[P0] 用户A token 可访问用户B的 wx/user/coupon/{{id}} 接口')
    elif st not in (401, 403, 404):
        ISSUES.append(f'[P2] wx/user/coupon 越权探测返回异常 HTTP {st}')

    # logout invalidates token
    st_lo, _ = post('/auth/logout', token=a['token'])
    st_prof, _ = get('/user/profile', a['token'])
    if st_lo == 200 and st_prof == 200:
        ISSUES.append('[P2] logout 后旧 token 仍可访问 profile（token_version 未生效？）')
    elif st_lo == 200 and st_prof == 401:
        print('logout 后 token 失效: OK')
        # re-login A for further tests
        a['token'], _, _, _ = login(a['phone'])

# 未登录访问
st, body = get('/user/profile')
if st != 401:
    ISSUES.append(f'[P1] 未登录 /user/profile 应 401，实际 {st}')

# 验证码边界
st, body = post('/auth/login_sms', {'phone': '13800001111', 'code': '000000'})
if st == 200 and body.get('token'):
    ISSUES.append('[P1] 错误验证码仍可登录')

# 管理员 token 访问用户 profile
st_adm, adm = post('/auth/admin/login', {'username': 'test', 'password': 'x'})
adm_tok = (adm.get('data') or {}).get('token')
if adm_tok:
    st, body = get('/user/profile', adm_tok)
    if st == 200:
        ISSUES.append('[P2] 管理员 token 可访问 /user/profile 并返回数据')

# coupon id 重叠
if len(sessions) >= 2:
    ids_a = set()
    ids_b = set()
    for row in list_from(sessions[0]['endpoints']['coupons/my']['body']):
        if row.get('id') is not None:
            ids_a.add(row['id'])
    for row in list_from(sessions[1]['endpoints']['coupons/my']['body']):
        if row.get('id') is not None:
            ids_b.add(row['id'])
    overlap = ids_a & ids_b
    if overlap:
        ISSUES.append(f'[P0] 不同用户优惠券 issue id 重叠: {overlap}')
    else:
        print(f'优惠券隔离: OK (A={len(ids_a)} B={len(ids_b)})')

print('\n=== 发现的问题 ===')
if not ISSUES:
    print('未发现新的 P0/P1 问题（当前扫描范围内）')
else:
    for i, x in enumerate(ISSUES, 1):
        print(f'{i}. {x}')

print('\n=== 各用户接口状态摘要 ===')
for s in sessions:
    print(f"\n{s['phone']} ({s['uid']}):")
    for name, info in s['endpoints'].items():
        print(f"  {name}: HTTP {info['status']} count={info['count']}")
