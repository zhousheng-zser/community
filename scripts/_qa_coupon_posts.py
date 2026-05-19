"""QA: 优惠券双接口数量是否一致、帖子未绑定小区行为"""
import json, ssl, urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

def post(path, body):
    r = urllib.request.Request(BASE + path, json.dumps(body).encode(), {'Content-Type':'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(r, context=ctx, timeout=12).read().decode())

def get(path, token):
    r = urllib.request.Request(BASE + path, headers={'Authorization':'Bearer '+token})
    return json.loads(urllib.request.urlopen(r, context=ctx, timeout=12).read().decode())

tok = post('/auth/login_sms', {'phone':'13800001111','code':'024680'})['token']
uid = post('/auth/login_sms', {'phone':'13800001111','code':'024680'})['user']['id']
my = get('/coupons/my?page=1&page_size=100', tok)
legacy = get(f'/wx/user/coupon/{uid}', tok)
my_list = (my.get('data') or {}).get('list') or my.get('list') or []
leg_list = legacy if isinstance(legacy, list) else (legacy.get('data') or legacy.get('list') or [])
print('coupons/my total', (my.get('data') or {}).get('total'), 'list', len(my_list))
print('wx/user/coupon list', len(leg_list))
print('statuses my:', sorted(set(x.get('status') for x in my_list)))
# posts without community
posts = get('/posts?category=热门话题&page=1&limit=5', tok)
pl = posts.get('list') or posts.get('data') or []
print('posts with login total', posts.get('total'), 'list', len(pl))
