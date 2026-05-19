"""
修复 coreDataController.js 中 toAbsoluteAssetUrl 把相对路径转成 IP 绝对 URL 的问题
改为直接返回相对路径，由小程序端 imgUrl() 负责拼接
"""
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

CTRL = '/root/community-backend/backend/src/controllers/coreDataController.js'

# 查看 toAbsoluteAssetUrl 相关代码
print('=== 当前 toAbsoluteAssetUrl 相关代码 ===')
print(run(f'grep -n "toAbsolute\\|icon_url.*toAbs\\|toAbs.*icon" {CTRL}'))

# 下载文件内容
sftp = c.open_sftp()
with sftp.open(CTRL, 'r') as f:
    content = f.read().decode('utf-8')

print(f'\n文件大小: {len(content)} 字节')

# 查看 toAbsoluteAssetUrl 函数定义
if 'toAbsoluteAssetUrl' in content:
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'toAbsoluteAssetUrl' in line:
            start = max(0, i-2)
            end = min(len(lines), i+5)
            print(f'\n--- 行 {i+1} 附近 ---')
            for j in range(start, end):
                print(f'{j+1}: {lines[j]}')

# 修复：把 toAbsoluteAssetUrl(req, icon) || icon 替换为直接返回 icon
old1 = 'icon_url: toAbsoluteAssetUrl(req, icon) || icon,'
new1 = 'icon_url: icon,'

old2 = "exports.getServiceHomeModules = async (req, res) => {"
# 还需要把 req 参数传递的地方也保持不变，仅替换 icon_url 行

count = content.count(old1)
print(f'\n找到 {count} 处 "{old1}"')

if count > 0:
    fixed = content.replace(old1, new1)
    # 备份原文件
    run(f'cp {CTRL} {CTRL}.bak')
    # 写入修复后的内容
    with sftp.open(CTRL, 'w') as f:
        f.write(fixed.encode('utf-8'))
    print(f'[OK] 已修复 {count} 处，并备份为 .bak')
else:
    print('[SKIP] 未找到待修复的代码，检查实际内容:')
    # 打印 icon_url 相关行
    for i, line in enumerate(content.split('\n')):
        if 'icon_url' in line and ('toAbs' in line or 'Abs' in line):
            print(f'  {i+1}: {line}')

sftp.close()

# 重启 backend
print('\n=== 重启 backend ===')
run('pkill -f "node src/index.js" || true')
time.sleep(2)
run('cd /root/community-backend/backend && nohup node src/index.js >> nohup.out 2>&1 &')
time.sleep(4)

print('进程:', run('pgrep -af "node src/index.js"'))

# 验证
print('\n=== 验证 icon_url ===')
r = run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')
print(r[:500])
print()
r2 = run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')
print(r2[:400])

c.close()
print('\n[DONE]')
