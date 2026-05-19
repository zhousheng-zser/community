import json, urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001'

def req(path, method='GET', body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()) if e.read() else {}

login = req('/api/v1/auth/admin/login', 'POST', {'username': 'admin', 'password': 'admin123'})
token = login[1]['data']['token']
print('login', login[0])

# create test module
code, res = req('/api/v1/admin/service-home/modules', 'POST', {
    'group_key': 'test_align',
    'title': '对齐测试',
    'price_unit': '次',
    'sort_order': 99,
    'is_active': 1
}, token)
print('create', code, res)

mid = res.get('data', {}).get('id') if res.get('errno') == 0 else None

if mid:
    code, res = req(f'/api/v1/admin/service-home/modules/{mid}', 'DELETE', None, token)
    print('delete', code, res)
else:
    print('create failed, skip delete')
