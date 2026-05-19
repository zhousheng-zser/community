"""登录全链路 + 多账号信息一致性深度测试"""
import json, ssl, urllib.request, urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'
ISSUES = []
PASS = []

def req(method, path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=18)
        raw = resp.read().decode('utf-8', errors='replace')
        try:
            return resp.status, json.loads(raw)
        except Exception:
            return resp.status, {'raw': raw[:400]}
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', errors='replace')
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:400]}

def login_sms(phone, code='024680'):
    st, b = req('POST', '/auth/login_sms', {'phone': phone, 'code': code})
    tok = b.get('token') or (b.get('data') or {}).get('token')
    user = b.get('user') or (b.get('data') or {}).get('user') or {}
    return st, tok, user, b

def login_pwd(phone, password):
    st, b = req('POST', '/auth/login_password', {'phone': phone, 'password': password})
    tok = b.get('token') or (b.get('data') or {}).get('token')
    user = b.get('user') or (b.get('data') or {}).get('user') or {}
    return st, tok, user, b

def pdata(b):
    return b.get('data') if isinstance(b, dict) and 'data' in b else b

def list_from(b):
    d = pdata(b)
    if isinstance(d, list):
        return d
    if isinstance(d, dict):
        for k in ('list', 'rows', 'items', 'orders'):
            if isinstance(d.get(k), list):
                return d[k]
    if isinstance(b, dict):
        for k in ('list', 'rows'):
            if isinstance(b.get(k), list):
                return b[k]
    return []

def profile_snapshot(token, login_user):
    checks = {}
    st, prof = req('GET', '/user/profile', token=token)
    pd = pdata(prof) or prof
    lid = str((login_user or {}).get('id', ''))
    pid = str(pd.get('id', ''))
    lphone = str((login_user or {}).get('phone', ''))
    pphone = str(pd.get('phone') or pd.get('userMobile') or '')
    checks['profile_match'] = lid == pid and lid != ''
    checks['phone_match'] = (not lphone or not pphone or lphone == pphone)
    checks['profile_id'] = pid
    checks['nickname'] = pd.get('nickname')
    checks['steward'] = pd.get('steward_status') or pd.get('stewardStatus')
    checks['merchant'] = pd.get('merchant_status') or pd.get('merchantStatus')
    checks['community_id'] = pd.get('community_id') or pd.get('communityId')

    st2, inv = req('GET', '/user/invite-code', token=token)
    invd = pdata(inv) or {}
    checks['invite_user_id'] = invd.get('user_id')
    if invd.get('user_id') is not None and str(invd.get('user_id')) != pid:
        ISSUES.append(f'[P1] {lphone} invite-code user_id={invd.get("user_id")} != profile={pid}')

    st3, coup = req('GET', '/coupons/my?page=1&page_size=5', token=token)
    checks['coupons_status'] = st3
    checks['coupons_count'] = len(list_from(coup))

    st4, comm = req('GET', '/promoter/commission', token=token)
    checks['commission_status'] = st4

    st5, posts = req('GET', '/posts/my/published?page=1&limit=3', token=token)
    checks['my_posts_status'] = st5

    if not checks['profile_match']:
        ISSUES.append(f'[P0] {lphone} login_id={lid} profile_id={pid}')
    if st != 200:
        ISSUES.append(f'[P1] {lphone} profile HTTP {st}')
    if st3 >= 500 or st4 >= 500:
        ISSUES.append(f'[P1] {lphone} coupons={st3} commission={st4}')
    return checks

ACCOUNTS = [
    {'phone': '13800001111', 'pwd': '123456', 'label': 'E2E普通(rejected管家)'},
    {'phone': '15267619061', 'pwd': None, 'label': 'E2E普通(approved管家)'},
    {'phone': '13800000000', 'pwd': None, 'label': '微信用户(approved商家)'},
    {'phone': '13900002222', 'pwd': None, 'label': 'E2E服务商'},
    {'phone': '15026470915', 'pwd': None, 'label': 'E2E技工'},
]

print('=== 1. 登录方式测试 ===')
st, tok, user, b = login_sms('13800001111')
if tok:
    PASS.append('短信登录 13800001111 OK')
else:
    ISSUES.append(f'[P0] 短信登录失败: {b}')
st2, tok2, _, b2 = login_pwd('13800001111', '123456')
if tok2:
    PASS.append('密码登录 13800001111 OK')
else:
    ISSUES.append(f'[P1] 密码登录失败: {b2}')
st3, _, _, b3 = login_sms('13800001111', '000000')
if st3 == 200 and (b3.get('token')):
    ISSUES.append('[P1] 错误验证码仍可登录')
else:
    PASS.append('错误验证码被拒绝 OK')
st4, _, _, b4 = login_sms('13999999999')
if st4 == 200 and b4.get('token'):
    ISSUES.append('[P1] 未注册手机号可登录')
else:
    PASS.append('未注册手机号拒绝 OK')

print('\n=== 2. 多账号登录后信息一致性 ===')
sessions = []
for acc in ACCOUNTS:
    st, tok, user, body = login_sms(acc['phone'])
    if not tok and acc.get('pwd'):
        st, tok, user, body = login_pwd(acc['phone'], acc['pwd'])
    if not tok:
        ISSUES.append(f"[P1] {acc['label']} {acc['phone']} 无法登录")
        continue
    snap = profile_snapshot(tok, user)
    snap['phone'] = acc['phone']
    snap['label'] = acc['label']
    snap['token'] = tok
    sessions.append(snap)
    ok = snap['profile_match'] and snap['phone_match']
    print(f"{acc['phone']} [{acc['label']}]: profile={'OK' if ok else 'FAIL'} id={snap['profile_id']} steward={snap['steward']} merchant={snap['merchant']}")

print('\n=== 3. 切换账号（A logout → B login）===')
if len(sessions) >= 2:
    a, b = sessions[0], sessions[1]
    req('POST', '/auth/logout', token=a['token'])
    st_old, old_prof = req('GET', '/user/profile', token=a['token'])
    if st_old == 200:
        ISSUES.append('[P2] A logout 后 token 仍可读 profile')
    else:
        PASS.append('logout 后旧 token 失效 OK')
    st_b, b_prof = req('GET', '/user/profile', token=b['token'])
    bpd = pdata(b_prof) or {}
    if str(bpd.get('id')) != b['profile_id']:
        ISSUES.append('[P0] B token profile 与登录时不一致')
    else:
        PASS.append('B 账号 profile 仍正确 OK')

print('\n=== 4. 跨账号 token 越权 ===')
if len(sessions) >= 2:
    a, b = sessions[0], sessions[1]
    st_x, xprof = req('GET', '/user/profile', token=b['token'])
    xpd = pdata(xprof) or {}
    if str(xpd.get('id')) == a['profile_id']:
        ISSUES.append('[P0] 用 B token 读到了 A 的 profile')
    else:
        PASS.append('token 与 profile 绑定正确 OK')
    # legacy coupon path with wrong id
    st_w, wb = req('GET', f"/wx/user/coupon/{a['profile_id']}", token=b['token'])
    if st_w == 200 and list_from(wb):
        ISSUES.append('[P0] B token 可读 A 的 wx/user/coupon/{A_id}')
    elif st_w in (401, 403):
        PASS.append('wx/user/coupon 越权拦截 OK')

print('\n=== 5. 角色差异 spot check ===')
by_phone = {s['phone']: s for s in sessions}
if '15267619061' in by_phone and by_phone['15267619061'].get('steward') != 'approved':
    ISSUES.append('[P2] 15267619061 应为 approved 管家，实际: ' + str(by_phone['15267619061'].get('steward')))
if '13800000000' in by_phone and by_phone['13800000000'].get('merchant') != 'approved':
    ISSUES.append('[P2] 13800000000 应为 approved 商家，实际: ' + str(by_phone['13800000000'].get('merchant')))

print('\n=== PASS (%d) ===' % len(PASS))
for p in PASS:
    print('  +', p)
print('\n=== ISSUES (%d) ===' % len(ISSUES))
if ISSUES:
    for i, x in enumerate(ISSUES, 1):
        print(f'  {i}. {x}')
else:
    print('  (无)')
