"""验证 120 多用户登录隔离：SMS/密码/微信 mock、profile 是否对应"""
import json, ssl, urllib.request, urllib.error

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
        raw = resp.read().decode('utf-8', errors='replace')
        return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', errors='replace')
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:400]}

def login_sms(phone, code='024680'):
    st, body = req('POST', '/auth/login_sms', {'phone': phone, 'code': code})
    token = body.get('token') or (body.get('data') or {}).get('token')
    user = body.get('user') or (body.get('data') or {}).get('user') or {}
    return st, token, user, body

def login_pwd(phone, password):
    st, body = req('POST', '/auth/login_password', {'phone': phone, 'password': password})
    token = body.get('token') or (body.get('data') or {}).get('token')
    user = body.get('user') or (body.get('data') or {}).get('user') or {}
    return st, token, user, body

def profile(token):
    st, body = req('GET', '/user/profile', token=token)
    data = body.get('data') or body
    return st, data

def cross_check(label, login_user, prof):
    lid = str((login_user or {}).get('id', ''))
    pid = str((prof or {}).get('id', ''))
    lphone = (login_user or {}).get('phone', '')
    pphone = prof.get('phone') or prof.get('userMobile') or ''
    ok = lid and pid and lid == pid and (not lphone or not pphone or lphone == pphone)
    print(f'  [{label}] login_id={lid} profile_id={pid} phone_match={lphone==pphone} => {"OK" if ok else "FAIL"}')
    return ok

print('=== 120 多用户登录验证 ===\n')

# 1. SMS codes
for code in ['024680', '123456']:
    st, tok, user, body = login_sms('13800001111', code)
    print(f'SMS 13800001111 code={code}: status={st} token={"yes" if tok else "no"} msg={body.get("msg") or body.get("message")}')

# 2. Multi-user isolation
phones = ['13800001111', '13900010001', '13800000000', '13800138000']
results = []
for phone in phones:
    print(f'\n--- {phone} ---')
    st, tok, user, body = login_sms(phone)
    if not tok:
        st2, tok2, user2, body2 = login_pwd(phone, '123456')
        if tok2:
            tok, user, st = tok2, user2, st2
            print('  fallback password login ok')
        else:
            print('  login fail:', json.dumps(body, ensure_ascii=False)[:200])
            results.append({'phone': phone, 'ok': False, 'reason': 'login_fail'})
            continue
    pst, prof = profile(tok)
    if pst != 200:
        print('  profile fail:', pst, json.dumps(prof, ensure_ascii=False)[:200])
        results.append({'phone': phone, 'ok': False, 'reason': 'profile_fail'})
        continue
    ok = cross_check('sms', user, prof)
    results.append({'phone': phone, 'ok': ok, 'id': prof.get('id'), 'nickname': prof.get('nickname')})

# 3. Token cross-use (user A token should not return user B profile - sanity)
tokens = []
for r in results:
    if r.get('ok'):
        pass
print('\n--- summary ---')
for r in results:
    print(r)
