import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# 1. 查所有占用 3001/3002 端口的进程
print('=== 端口占用 ===')
print(run('ss -tlnp | grep -E "3001|3002"'))

# 2. 强杀所有 node src/index 进程
print('\n=== 杀掉所有 node src/index.js ===')
print(run('pkill -9 -f "node src/index.js"; sleep 1; pgrep -af "node src/index"'))

# 3. 再查端口
print('\n=== 杀后端口状态 ===')
time.sleep(2)
print(run('ss -tlnp | grep -E "3001|3002"'))

# 4. 确认 coreDataController 修复已生效
print('\n=== 确认 icon_url 修复 ===')
print(run('grep -n "toAbsoluteAssetUrl" /root/community-backend/backend/src/controllers/coreDataController.js'))

# 5. 重新启动
print('\n=== 启动 backend ===')
c.exec_command('setsid bash -c "cd /root/community-backend/backend && node src/index.js >> nohup.out 2>&1" &')
time.sleep(6)

print('进程:', run('pgrep -af "node src/index.js"'))
print('端口:', run('ss -tlnp | grep -E "3001|3002"'))

# 6. 本地测试
print('\n=== 本地 3002 测试 ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')[:400])
print()
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')[:400])

# 7. HTTPS 3001 测试
print('\n=== 本地 3001 (https) 测试 ===')
print(run('curl -sk https://127.0.0.1:3001/api/v1/core/service-groups/gfg')[:400])

c.close()
print('\n[DONE]')
