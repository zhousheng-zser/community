import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=25):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

tok = run("curl -sk -X POST https://127.0.0.1:3002/api/v1/auth/login_sms -H 'Content-Type: application/json' -d '{\"phone\":\"13800000000\",\"code\":\"024680\"}' | python3 -c \"import sys,json; b=json.load(sys.stdin); print(b.get('token') or (b.get('data') or {}).get('token',''))\"")
print('token len', len(tok))

for cat in ['热门话题', '热门活动']:
    enc = run(f"python3 -c \"import urllib.parse; print(urllib.parse.quote('{cat}'))\"")
    out = run(f"curl -sk 'https://127.0.0.1:3002/api/v1/posts?category={enc}&page=1&limit=10' -H 'Authorization: Bearer {tok}'")
    print(f'\n=== API category={cat} ===')
    print(out[:800])

# check deployed getPosts
print('\n=== grep postController on server ===')
print(run('grep -n "community_id\\|resolveViewerCommunityId" /root/community-backend/backend/src/controllers/postController.js | head -20'))
print(run('grep -n "postRoutes\\|postController" /root/community-backend/backend/src/index.js | head -10'))
c.close()
