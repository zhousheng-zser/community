#!/usr/bin/env python3
"""Audit benefit_alliance_goods + jd_benefit_goods on 120 for invalid links."""
import re
import paramiko

HOST = '120.27.239.244'
PWD = 'cW123456'
DB_CMD = "mysql -uroot -pCommunityPwd123! community_db -N -e"

# Known bad URL patterns (typos, placeholders, non-http taobao-only codes without usable link)
BAD_URL_PATTERNS = [
    r'kzurllG\.cn',           # typo
    r'example\.com',
    r'127\.0\.0\.1',
    r'localhost',
    r'^\s*$',
]
# Taobao "spread" that is only 淘口令 without http — cannot open in mini program
TAOBAO_CODE_ONLY = re.compile(r'^￥.+￥')

VALID_PREFIX = {
    'jd': (r'^https?://u\.jd\.com/', r'u\.jd\.com'),
    'pdd': (r'^https?://p\.pinduoduo\.com/', r'pinduoduo'),
    'meituan': (r'^https?://(dpurl\.cn|wxaurl\.cn|http://dpurl)', r'dpurl|wxaurl'),
    'shangou': (r'^https?://(u\.ele\.me|kzurl)', r'ele\.me|kzurl'),
    'shequn': (r'^https?://', r'https'),
    'tuixiao': (r'^https?://', r'https'),
    'taobao': None,  # special: 淘口令 or http
}


def is_bad_url(url, platform):
    u = (url or '').strip()
    if not u:
        return True, 'empty spread_url'
    for pat in BAD_URL_PATTERNS:
        if re.search(pat, u, re.I):
            return True, f'bad pattern {pat}'
    if platform == 'taobao':
        if TAOBAO_CODE_ONLY.match(u) and not u.startswith('http'):
            return True, 'taobao code only (no http link)'
        if u.startswith('http'):
            return False, ''
        return True, 'taobao code only'
    if platform in ('jd', 'pdd'):
        if not u.startswith('http'):
            return True, 'missing http(s)'
    if 'kzurl' in u.lower():
        # suspicious typo domains (capital G in cn TLD path)
        if re.search(r'kzurl[a-z]*G\.cn', u, re.I):
            return True, 'suspicious kzurl typo domain'
    return False, ''


def is_bad_image(img):
    im = (img or '').strip()
    if not im:
        return True, 'no image'
    if 'example.com' in im or '127.0.0.1' in im:
        return True, 'placeholder image host'
    return False, ''


c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', PWD, timeout=15, look_for_keys=False, allow_agent=False)

sql = r"""
SELECT id, platform, title, spread_url, image_url, status
FROM benefit_alliance_goods
WHERE scene='benefit_card'
ORDER BY platform, sort_order, id;
"""
_, o, e = c.exec_command(f'{DB_CMD} "{sql}" 2>/dev/null', timeout=30)
rows = o.read().decode('utf-8', 'replace').strip().splitlines()

invalid_ids = []
report = []
for line in rows:
    if not line.strip():
        continue
    parts = line.split('\t')
    if len(parts) < 6:
        continue
    rid, platform, title, spread, image, status = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
    reasons = []
    bad_u, ru = is_bad_url(spread, platform)
    if bad_u:
        reasons.append(ru)
    bad_i, ri = is_bad_image(image)
    if bad_i and platform not in ('taobao',):  # taobao may still show with image
        reasons.append(ri)
    if reasons:
        invalid_ids.append(int(rid))
        report.append(f"  #{rid} [{platform}] {title[:40]} | {spread[:60]} | reasons: {', '.join(reasons)}")

# jd_benefit_goods if table exists
sql2 = "SELECT id, sku_id, title, spread_url, image_url, status FROM jd_benefit_goods WHERE scene='benefit_card' OR 1=1 LIMIT 50;"
_, o2, _ = c.exec_command(f'{DB_CMD} "{sql2}" 2>/dev/null', timeout=20)
jd_lines = o2.read().decode('utf-8', 'replace').strip().splitlines()
jd_invalid = []
for line in jd_lines:
    if not line.strip():
        continue
    parts = line.split('\t')
    if len(parts) < 6:
        continue
    rid, sku, title, spread, image, status = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
    bad_u, ru = is_bad_url(spread, 'jd')
    bad_i, ri = is_bad_image(image)
    if bad_u or bad_i:
        jd_invalid.append(int(rid))
        report.append(f"  jd_benefit #{rid} sku={sku} | {spread[:50]} | {', '.join(filter(None, [ru, ri]))}")

out = ['=== Invalid benefit_alliance_goods ===', f'count: {len(invalid_ids)}']
out.extend(report)
out.append(f'\nIDs to delete: {invalid_ids}')
out.append(f'jd_benefit invalid: {jd_invalid}')

if invalid_ids:
    id_list = ','.join(str(x) for x in invalid_ids)
    del_sql = f"DELETE FROM benefit_alliance_goods WHERE id IN ({id_list});"
    _, od, _ = c.exec_command(f'{DB_CMD} "{del_sql}" 2>&1', timeout=20)
    out.append('\nDELETE result: ' + od.read().decode('utf-8', 'replace')[:200])

if jd_invalid:
    id_list = ','.join(str(x) for x in jd_invalid)
    del_sql = f"DELETE FROM jd_benefit_goods WHERE id IN ({id_list});"
    _, od, _ = c.exec_command(f'{DB_CMD} "{del_sql}" 2>&1', timeout=20)
    out.append('jd DELETE: ' + od.read().decode('utf-8', 'replace')[:200])

# Also deactivate taobao rows without http (set inactive instead of delete if user wants keep for admin)
# Mark status=inactive for borderline
inactive_sql = """
UPDATE benefit_alliance_goods SET status='inactive', updated_at=NOW()
WHERE scene='benefit_card' AND platform='taobao'
  AND spread_url NOT LIKE 'http%' AND spread_url LIKE '￥%';
"""
_, oi, _ = c.exec_command(f'{DB_CMD} "{inactive_sql}" 2>&1', timeout=20)
out.append('\nTaobao inactive: ' + oi.read().decode('utf-8', 'replace')[:120])

# kzurll typo in meituan
_, om, _ = c.exec_command(
    f"""{DB_CMD} "DELETE FROM benefit_alliance_goods WHERE scene='benefit_card' AND spread_url LIKE '%kzurll%';" 2>&1""",
    timeout=20
)
out.append('kzurll cleanup: ' + om.read().decode('utf-8', 'replace')[:120])

c.close()
text = '\n'.join(out)
open(r'd:\CODE\project\community\scripts\_benefit_audit_out.txt', 'w', encoding='utf-8').write(text)
print(text)
