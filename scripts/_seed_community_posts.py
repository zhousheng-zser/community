"""检查帖子可见性并补种邻居动态"""
import json, ssl, urllib.request, urllib.parse, paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def req(method, path, body=None, token=None):
    h = {'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def login(phone):
    st, b = req('POST', '/auth/login_sms', {'phone': phone, 'code': '024680'})
    tok = b.get('token') or (b.get('data') or {}).get('token')
    return tok

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command(
    "MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
    "\"SELECT id,user_id,community_id,category,LEFT(content,35) c FROM posts ORDER BY id;\"",
    timeout=15
)
print('=== DB posts ===')
print(o.read().decode('utf-8', 'replace'))

viewer = login('13800000000')
for cat in ['热门话题', '热门活动']:
    q = urllib.parse.urlencode({'category': cat, 'page': 1, 'limit': 20, 'community_id': 1})
    st, body = req('GET', '/posts?' + q, token=viewer)
    lst = body.get('list') or []
    print(f'\n13800000000 看 {cat}: {len(lst)} 条')
    for p in lst:
        print(f"  id={p.get('id')} author={(p.get('author') or {}).get('nickname')} uid={p.get('user_id')} { (p.get('content') or '')[:25]}")

# 补种
SEED = [
    ('13800001111', '热门话题', '周末小区团购有没有一起的？#邻里分享'),
    ('15267619061', '热门话题', '推荐一家好吃的早餐店，就在东门对面'),
    ('13900002222', '热门活动', '本周六社区义诊，欢迎邻居们参加！'),
    ('15026470915', '热门活动', '亲子手工活动报名中，限 20 家庭'),
]
print('\n=== 补种邻居动态 ===')
for phone, cat, content in SEED:
    tok = login(phone)
    st, body = req('POST', '/posts', {'content': content, 'category': cat, 'images': []}, token=tok)
    ok = st in (200, 201) and not (isinstance(body, dict) and body.get('error'))
    pid = ((body.get('data') or {}).get('id') if isinstance(body, dict) else None)
    print(f'[{ "OK" if ok else "FAIL"}] {phone} {cat} id={pid} {content[:20]}')

print('\n=== 补种后 ===')
for cat in ['热门话题', '热门活动']:
    q = urllib.parse.urlencode({'category': cat, 'page': 1, 'limit': 20, 'community_id': 1})
    st, body = req('GET', '/posts?' + q, token=viewer)
    lst = body.get('list') or []
    print(f'{cat}: {len(lst)} 条')
    for p in lst:
        print(f"  {(p.get('author') or {}).get('nickname','?')} | {(p.get('content') or '')[:30]}")
c.close()
