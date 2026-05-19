import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# 确认进程状态
print('=== 进程 ===')
print(run('pgrep -af "node src/index.js"'))

# 如果没有进程，重启（用 setsid 隔离，避免 nohup 超时）
pids = run('pgrep -f "node src/index.js"')
if not pids:
    print('[启动中...]')
    c.exec_command('setsid /bin/bash -c "cd /root/community-backend/backend && node src/index.js >> nohup.out 2>&1" &')
    time.sleep(5)
    print('PID:', run('pgrep -f "node src/index.js"'))

# 验证 icon_url 是否已变为相对路径
time.sleep(2)
print('\n=== service-home-modules ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')[:600])

print('\n=== service-groups/gfg ===')
print(run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')[:400])

print('\n=== nohup tail ===')
print(run('tail -8 /root/community-backend/backend/nohup.out'))

c.close()
print('\n[DONE]')
