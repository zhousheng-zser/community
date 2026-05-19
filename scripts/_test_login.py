import json, urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASES = [
    'https://jshsp1.eds-tech.cn',
    'https://120.27.239.244:3001',
]

def post(base, path, body):
    req = urllib.request.Request(
        base + path,
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=12)
        return r.status, r.read().decode('utf-8', errors='replace')[:800]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', errors='replace')[:800]
    except Exception as e:
        return -1, str(e)

tests = [
    ('/api/v1/auth/login', {'code': 'test_code'}),
    ('/api/v1/auth/login_password', {'phone': '13800138000', 'password': '123456'}),
    ('/api/v1/auth/admin/login', {'username': 'admin', 'password': 'admin123'}),
]

for base in BASES:
    print('\n===', base, '===')
    for path, body in tests:
        code, text = post(base, path, body)
        print(path, '->', code, text[:200])
