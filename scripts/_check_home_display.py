#!/usr/bin/env python3
import paramiko, urllib.request, json, time
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST, PWD = '120.27.239.244', 'cW123456'

for attempt in range(3):
    try:
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        c.connect(HOST, 22, 'root', PWD, timeout=20, look_for_keys=False, allow_agent=False)
        break
    except Exception as e:
        print(f'SSH attempt {attempt+1} failed: {e}')
        time.sleep(3)
else:
    print('SSH failed 3 times, abort')
    exit(1)

def sql(q):
    _, o, _ = c.exec_command(f'mysql -uroot -pCommunityPwd123! community_db -N -e "{q}" 2>/dev/null', timeout=20)
    return o.read().decode('utf-8', 'replace').strip()

print('=== service_home_modules ===')
print(sql("SELECT id,group_key,title,icon_url,sort_order,is_active FROM service_home_modules ORDER BY sort_order,id"))

for gk in ['gfg', 'ddsd']:
    print(f'\n=== categories for {gk} ===')
    print(sql(f"SELECT id,name,group_type FROM categories WHERE group_type='{gk}'"))
    print(f'=== services for {gk} ===')
    print(sql(f"SELECT s.id,s.title,s.price,s.is_published,c.name cat FROM services s JOIN categories c ON c.id=s.category_id WHERE c.group_type='{gk}'"))

c.close()

print('\n=== API service-home-modules ===')
r = urllib.request.urlopen('https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules', timeout=15)
d = json.loads(r.read())
for m in d.get('data', []):
    print(f"  {m['group_key']:20} {m.get('title',''):12} icon={m.get('icon_url') or 'NULL'}")

print('\n=== API service-groups/gfg ===')
try:
    r2 = urllib.request.urlopen('https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg', timeout=15)
    print(json.dumps(json.loads(r2.read()), ensure_ascii=False, indent=2)[:600])
except Exception as e:
    print('ERROR', e)
