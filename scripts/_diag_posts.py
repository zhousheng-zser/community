"""诊断社区帖子发布与列表"""
import json, ssl, urllib.request, urllib.parse, paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def req(method, path, body=None, token=None):
    h = {'Content-Type': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
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
    user = b.get('user') or (b.get('data') or {}).get('user') or {}
    return tok, user

for phone in ['13800000000', '13800001111']:
    tok, user = login(phone)
    uid = str(user.get('id', ''))
    st, prof = req('GET', '/user/profile', token=tok)
    pd = prof.get('data') or prof
    cid = pd.get('community_id') or pd.get('communityId')
    print(f'\n=== {phone} uid={uid} community_id={cid} ===')
    for cat in ['热门话题', '热门活动']:
        q = urllib.parse.urlencode({'category': cat, 'page': 1, 'limit': 10})
        st, body = req('GET', '/posts?' + q, token=tok)
        if isinstance(body, list):
            lst = body
        elif isinstance(body, dict):
            lst = body.get('list') or body.get('data') or []
            if isinstance(lst, dict) and 'list' in lst:
                lst = lst['list']
        else:
            lst = []
        print(f'  GET /posts category={cat}: HTTP {st} count={len(lst) if isinstance(lst,list) else "?"}')
        if isinstance(lst, list):
            for p in lst[:3]:
                print(f'    id={p.get("id")} cat={p.get("category")} comm={p.get("community_id")} {(p.get("content") or "")[:30]}')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command(
    "MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
    "\"SELECT id,user_id,community_id,category,LEFT(content,40) content,createdAt FROM Posts ORDER BY id DESC LIMIT 10;\" 2>&1",
    timeout=15
)
print('\n=== DB Posts (latest) ===')
print(o.read().decode('utf-8', 'replace'))
c.close()
