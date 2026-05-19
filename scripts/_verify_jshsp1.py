import sys, urllib.request, ssl
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for label, url in [
    ('service-home-modules', 'https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules'),
    ('service-groups/gfg',   'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg'),
    ('service-groups/tidy',  'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/tidy'),
]:
    try:
        with urllib.request.urlopen(url, context=ctx, timeout=15) as r:
            body = r.read().decode('utf-8', 'replace')
            print(f'[{r.status}] {label}')
            print(body[:500])
    except Exception as e:
        print(f'[ERR] {label}: {e}')
    print()
