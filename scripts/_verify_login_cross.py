"""交叉验证：不同用户 token 不可互用 profile"""
import json, ssl, urllib.request, urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def post(path, body):
    r = urllib.request.Request(BASE + path, json.dumps(body).encode(), {'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

def get(path, token):
    r = urllib.request.Request(BASE + path, headers={'Authorization': 'Bearer ' + token}, method='GET')
    resp = urllib.request.urlopen(r, context=ctx, timeout=15)
    return json.loads(resp.read().decode())

def sms_login(phone):
    b = post('/auth/login_sms', {'phone': phone, 'code': '024680'})
    return b.get('token'), b.get('user') or {}

a_tok, a_u = sms_login('13800001111')
b_tok, b_u = sms_login('13800000000')
print('A', a_u.get('id'), a_u.get('phone'))
print('B', b_u.get('id'), b_u.get('phone'))

pa = get('/user/profile', a_tok).get('data') or get('/user/profile', a_tok)
pb = get('/user/profile', b_tok).get('data') or get('/user/profile', b_tok)
print('profile A id', pa.get('id'), 'phone', pa.get('phone'))
print('profile B id', pb.get('id'), 'phone', pb.get('phone'))
print('ids distinct', pa.get('id') != pb.get('id'))

# password login test
for phone, pwd in [('13800001111', '123456'), ('13800001111', 'Test1234!')]:
    b = post('/auth/login_password', {'phone': phone, 'password': pwd})
    print(f'pwd {phone}/{pwd}:', b.get('msg') or b.get('message'), 'token', bool(b.get('token')))

# admin login
adm = post('/auth/admin/login', {'username': 'wsxCDE', 'password': 'wrong'})
print('admin login sample:', str(adm)[:180])

# logout with user token
lo = urllib.request.Request(BASE + '/auth/logout', headers={'Authorization': 'Bearer ' + a_tok, 'Content-Type': 'application/json'}, method='POST')
try:
    resp = urllib.request.urlopen(lo, context=ctx, timeout=15)
    print('logout', resp.status, resp.read().decode()[:120])
except urllib.error.HTTPError as e:
    print('logout fail', e.code, e.read().decode()[:120])

# profile after logout (token_version bump should invalidate?)
try:
    get('/user/profile', a_tok)
    print('profile after logout: still works (token_version check may be absent)')
except urllib.error.HTTPError as e:
    print('profile after logout:', e.code)
