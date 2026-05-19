import paramiko, sys, io, json, urllib.request, ssl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# login
req = urllib.request.Request(
    'https://120.27.239.244:3001/api/v1/auth/admin/login',
    data=json.dumps({'username': 'admin', 'password': 'admin123'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
token = json.loads(urllib.request.urlopen(req, context=ctx, timeout=10).read())['data']['token']
print('token ok')

for path, method in [
    ('/api/v1/admin/service-home/modules', 'GET'),
]:
    req = urllib.request.Request(
        f'https://120.27.239.244:3001{path}',
        headers={'Authorization': f'Bearer {token}'},
        method=method
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=10)
        body = r.read().decode()
        print(path, r.status, body[:500])
    except urllib.error.HTTPError as e:
        print(path, e.code, e.read().decode()[:500])
