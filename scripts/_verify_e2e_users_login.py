import json, ssl, urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def login_profile(phone):
    req = urllib.request.Request(BASE + '/auth/login_sms', json.dumps({'phone': phone, 'code': '024680'}).encode(), {'Content-Type': 'application/json'}, method='POST')
    b = json.loads(urllib.request.urlopen(req, context=ctx, timeout=12).read().decode())
    tok = b.get('token')
    user = b.get('user') or {}
    if not tok:
        return {'phone': phone, 'ok': False, 'err': b.get('msg')}
    req2 = urllib.request.Request(BASE + '/user/profile', headers={'Authorization': 'Bearer ' + tok})
    p = json.loads(urllib.request.urlopen(req2, context=ctx, timeout=12).read().decode())
    data = p.get('data') or p
    return {
        'phone': phone,
        'ok': str(user.get('id')) == str(data.get('id')),
        'login_id': user.get('id'),
        'profile_id': data.get('id'),
        'nickname': data.get('nickname'),
        'worker': data.get('worker_status') or data.get('workerStatus'),
        'merchant': data.get('merchant_status') or data.get('merchantStatus'),
        'steward': data.get('steward_status') or data.get('stewardStatus'),
    }

phones = ['13800001111', '13900002222', '15267619061', '15026470915', '15026470916', '13800000000']
print('=== E2E users login isolation ===')
for ph in phones:
    print(login_profile(ph))
