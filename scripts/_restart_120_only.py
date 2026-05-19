"""仅在 120 重启后端并验证 gfg 接口"""
import sys, paramiko, time, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE = '/root/community-backend/backend'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

def run(cmd, t=25):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# 上传模型修复
for rel in ['backend/src/models/category.js', 'backend/src/models/service.js']:
    sftp.put(os.path.join(LOCAL, rel), f'{REMOTE}/src/models/{os.path.basename(rel)}')
    print(f'uploaded {rel}')

sftp.close()

# 杀掉旧进程，只留一个实例
run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 &')
time.sleep(4)

print('process:', run('pgrep -af "node src/index.js"'))
print('\n3002 gfg:', run('curl -s http://127.0.0.1:3002/api/v1/core/service-groups/gfg')[:600])
print('\n3002 modules:', run('curl -s http://127.0.0.1:3002/api/v1/core/service-home-modules')[:400])
print('\n3001 gfg (https):', run('curl -sk https://127.0.0.1:3001/api/v1/core/service-groups/gfg')[:400])

c.close()
print('DONE')
