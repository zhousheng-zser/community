import paramiko, sys, time, urllib.request, ssl
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. 检查 jshsp1 外网接口（tableName 修复后是否好了）
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for url in [
    'https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules',
    'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg',
    'https://jshsp1.eds-tech.cn/api/v1/core/service-groups/tidy',
]:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            print(f'[{r.status}] {url}')
            print(r.read()[:400].decode('utf-8', 'replace'))
    except Exception as e:
        print(f'[ERR] {url}: {e}')
    print()

# 2. 修复服务器上 cover_image 的绝对 URL 问题（normalizeServiceRow）
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

CTRL = '/root/community-backend/backend/src/controllers/coreDataController.js'
sftp = c.open_sftp()
with sftp.open(CTRL, 'r') as f:
    content = f.read().decode('utf-8')

# 修复 cover_image 那行：req ? toAbsoluteAssetUrl(req, cover) : cover → cover
old_cover = 'cover_image: req ? toAbsoluteAssetUrl(req, cover) : cover,'
new_cover = 'cover_image: cover,'
cnt = content.count(old_cover)
print(f'cover_image 修复处数: {cnt}')

if cnt > 0:
    fixed = content.replace(old_cover, new_cover)
    with sftp.open(CTRL, 'w') as f:
        f.write(fixed.encode('utf-8'))
    print('[OK] cover_image 已修复')
    # 重启
    run('pkill -f "node src/index.js" || true')
    time.sleep(2)
    c.exec_command('setsid /bin/bash -c "cd /root/community-backend/backend && node src/index.js >> nohup.out 2>&1" &')
    time.sleep(5)
    print('PID:', run('pgrep -f "node src/index.js"'))
    print('\n重启后 service-groups/gfg:')
    print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')[:400])
else:
    print('[已是相对路径，无需修复]')
    print(run('grep -n "cover_image.*req\\|toAbsolute" ' + CTRL))

sftp.close()
c.close()
print('\n[DONE]')
