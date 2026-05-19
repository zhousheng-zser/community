"""清除超大/无效上传图标，让小程序回退包内默认图"""
import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=20):
    _, o, e = c.exec_command(cmd, timeout=t)
    out = o.read().decode('utf-8', 'replace').strip()
    err = e.read().decode('utf-8', 'replace').strip()
    return out, err

# 查看上传文件大小
for f in [
    '/root/community-backend/backend/data/uploads/images/file-1779113700233-627700101.jpg',
    '/root/community-backend/backend/data/uploads/images/file-1779111932094-395868955.png',
]:
    print(run(f'ls -lh {f} 2>/dev/null || ls -lh /root/community-backend/backend/uploads/{f.split("/")[-1]} 2>/dev/null')[0])

# 清除 gfg/ddsd 的远程大图，改走小程序包内默认图标
sql = """
UPDATE service_home_modules
SET icon_url = NULL
WHERE group_key IN ('gfg', 'ddsd') AND icon_url LIKE '/uploads/%';
"""
print('\n=== 更新 DB ===')
print(run(f"MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e \"{sql.strip()}\"")[0])
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e \"SELECT group_key,title,icon_url FROM service_home_modules WHERE group_key IN ('gfg','ddsd')\"")[0])

print('\n=== API 验证 ===')
api, _ = run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')
try:
    data = json.loads(api).get('data', [])
    for row in data[:3]:
        print(row)
except Exception as ex:
    print(api[:500], ex)

c.close()
print('\n[OK] 已清除 gfg/ddsd 无效 icon_url')
