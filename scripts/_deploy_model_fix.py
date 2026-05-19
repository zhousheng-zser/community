"""
上传修复后的 category.js / service.js 到 120，重启 backend
"""
import sys, paramiko, time, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE = '/root/community-backend/backend'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

def run(cmd, timeout=20):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode('utf-8', 'replace').strip()

files = [
    ('backend/src/models/category.js', f'{REMOTE}/src/models/category.js'),
    ('backend/src/models/service.js',  f'{REMOTE}/src/models/service.js'),
]

print("=== 上传文件 ===")
for local_rel, remote_path in files:
    local_path = os.path.join(LOCAL, local_rel)
    sftp.put(local_path, remote_path)
    print(f"[OK] {local_rel} → {remote_path}")

sftp.close()

# 验证修改
print("\n=== 验证 tableName ===")
print(run('grep -n "tableName" /root/community-backend/backend/src/models/category.js'))
print(run('grep -n "tableName" /root/community-backend/backend/src/models/service.js'))

# 重启 backend
print("\n=== 重启 backend ===")
pid = run('pgrep -f "node src/index.js" | head -1')
print(f"当前 PID: {pid}")
if pid:
    run(f'kill {pid}')
    time.sleep(2)

# 重新启动
out = run('cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 &')
time.sleep(4)

# 验证新进程
new_pid = run('pgrep -f "node src/index.js" | head -1')
print(f"新 PID: {new_pid}")

# 验证 API
print("\n=== 等待启动后测试 API ===")
time.sleep(3)
r1 = run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg 2>&1 | head -c 500')
print(f"service-groups/gfg: {r1}")

r2 = run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/tidy 2>&1 | head -c 300')
print(f"\nservice-groups/tidy: {r2}")

# 外网测试
print("\n=== 外网 jshsp1 测试 ===")
r3 = run('curl -sk https://jshsp1.eds-tech.cn/api/v1/core/service-groups/gfg 2>&1 | head -c 600')
print(f"jshsp1 service-groups/gfg: {r3}")

c.close()
print("\n[DONE]")
