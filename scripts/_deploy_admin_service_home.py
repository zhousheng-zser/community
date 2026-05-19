import paramiko, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

local_file = Path(r'd:\CODE\project\community\admin\src\views\ServiceHomeManage.vue')
remote_path = '/root/community-backend/admin/src/views/ServiceHomeManage.vue'

sftp = c.open_sftp()
sftp.put(str(local_file), remote_path)
sftp.close()
print(f'已上传: {remote_path}')
print(run(f"ls -la {remote_path}"))

# Vite 是 dev 模式，HMR 自动生效，不需要重启
print('\n=== Vite 进程确认 ===')
print(run("ps aux | grep vite | grep -v grep | awk '{print $1,$2,$11,$12}'"))
c.close()
