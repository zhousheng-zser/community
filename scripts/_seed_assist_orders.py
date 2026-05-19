"""用多个邻居账号创建已支付帮帮单，填充 community-pool"""
import json, ssl, urllib.request, sys, random
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://120.27.239.244:3001/api/v1'

# 发布者（邻里互动应为空的那类账号）
VIEWER_PHONE = '13800000000'
# 用这些邻居账号各发一单
PUBLISHERS = [
    ('13800001111', '代取快递', '帮取菜鸟驿站 3 号柜'),
    ('15267619061', '跑腿', '帮忙买盒牛奶送到 2 栋'),
    ('13900002222', '代扔垃圾', '晚上 7 点帮忙带垃圾下楼'),
    ('15026470915', '陪读', '辅导孩子作业 1 小时'),
    ('13800001111', '其他', '帮忙照看阳台花盆浇水'),
]

TYPES = {
    '代取快递': 'take', '跑腿': 'errand', '代扔垃圾': 'trash',
    '陪读': 'read', '其他': 'other', '接送孩子': 'child',
}


def req(method, path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, context=ctx, timeout=20)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:300]}


def login(phone):
    st, b = req('POST', '/auth/login_sms', {'phone': phone, 'code': '024680'})
    tok = b.get('token') or (b.get('data') or {}).get('token')
    user = b.get('user') or (b.get('data') or {}).get('user') or {}
    if not tok:
        raise RuntimeError(f'{phone} 登录失败: {b}')
    return tok, user


def pool_count(token):
    st, b = req('GET', '/neighbor-assist/orders/community-pool?page=1&limit=20', token=token)
    d = b.get('data') if isinstance(b, dict) else b
    lst = (d.get('list') if isinstance(d, dict) else None) or []
    return st, len(lst), lst


print('=== 创建邻居帮帮订单 ===\n')
created = []

for phone, label, remark in PUBLISHERS:
    tok, user = login(phone)
    uid = str(user.get('id', ''))
    assist_type = TYPES.get(label, 'other')
    amount = f'{random.randint(5, 30)}.00'

    st, cr = req('POST', '/neighbor-assist/orders', {
        'assist_type': assist_type,
        'community_id': 1,
        'content': remark,
        'remark': remark,
        'origin_address_snapshot': {'address': '测试小区 1 栋', 'detail': '1 栋大厅'},
        'destination_address_snapshot': {'address': '测试小区 1 栋', 'detail': '1 栋大厅'},
        'reward_amount': amount,
    }, token=tok)

    d = cr.get('data') if isinstance(cr, dict) and 'data' in cr else cr
    oid = (d or cr).get('id') or (d or cr).get('order_id')
    if not oid:
        print(f'[FAIL] {phone} 创建失败 HTTP {st}: {cr}')
        continue

    st2, pay = req('POST', f'/neighbor-assist/orders/{oid}/pay', {}, token=tok)
    if st2 != 200 or (isinstance(pay, dict) and pay.get('errno') not in (0, None)):
        print(f'[WARN] {phone} 订单 {oid} 支付异常 HTTP {st2}: {pay}')
    else:
        print(f'[OK] {phone} uid={uid} -> 订单 {oid} ({label}) ¥{amount}')
        created.append({'phone': phone, 'id': oid, 'remark': remark})

print(f'\n新建 {len(created)} 条\n')

print('=== 验证邻里互动池 ===')
viewer_tok, viewer = login(VIEWER_PHONE)
viewer_uid = str(viewer.get('id', ''))
st, cnt, lst = pool_count(viewer_tok)
print(f'账号 {VIEWER_PHONE} (uid={viewer_uid}) community-pool: {cnt} 条')
for row in lst[:12]:
    pub = (row.get('publisher') or {}).get('nickname') or (row.get('publisher') or {}).get('id')
    print(f"  #{row.get('id')} {row.get('remark') or row.get('content','')[:24]} | 发布者={pub} | {row.get('status')}")

if cnt == 0:
    print('\n仍为 0，请检查 community_id 或登录状态')
    sys.exit(1)
print('\n[DONE] 邻里互动应有内容，请刷新小程序「社区-邻里互动」')
