"""验证技工详情 API 支持雪花 ID"""
import json, ssl, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def get(path):
    r = urllib.request.Request(BASE + path, method='GET')
    resp = urllib.request.urlopen(r, context=ctx, timeout=15)
    return json.loads(resp.read().decode())

workers = get('/core/workers?page=1&limit=3')
items = workers.get('data', {}).get('list') or (workers.get('data') if isinstance(workers.get('data'), list) else [])
wid = None
if items:
    wid = str(items[0].get('id') or items[0].get('user_id'))
else:
    # E2E 技工账号
    wid = '313949215095001091'
    print('list empty, fallback worker id:', wid)
print('worker id:', wid, 'len=', len(wid))

detail = get(f'/core/workers/{wid}')
d = detail.get('data') or detail
did = str(d.get('id') or d.get('user_id') or '')
print('detail id:', did)
assert did == wid, f'id mismatch {did} != {wid}'

svc = get(f'/core/workers/{wid}/services')
print('services errno:', svc.get('errno'), 'count=', len(svc.get('data') or []))
assert svc.get('errno') == 0

print('PASS: worker snowflake id detail OK')
