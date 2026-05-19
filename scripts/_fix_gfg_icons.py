import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

print('=== 删除前 ===')
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
          "\"SELECT id,group_key,title,icon_url FROM service_home_modules ORDER BY sort_order;\""))

print('\n=== 删除测试模块 gfg / ddsd ===')
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
          "\"DELETE FROM service_home_modules WHERE group_key IN ('gfg','ddsd');\""))

print('\n=== 删除后 ===')
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
          "\"SELECT id,group_key,title,icon_url,sort_order FROM service_home_modules ORDER BY sort_order;\""))

import ssl, urllib.request, json
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
r = urllib.request.urlopen(
    urllib.request.Request('https://120.27.239.244:3001/api/v1/core/service-home-modules'),
    context=ctx, timeout=10
)
api = json.loads(r.read().decode())
print('\n=== API 返回 ===')
for row in (api.get('data') or api):
    print(row.get('group_key'), row.get('title'))

c.close()
