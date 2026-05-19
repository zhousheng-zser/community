import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
files = [
    '/uploads/file-1779113700233-627700101.jpg',
    '/uploads/file-1779111932094-395868955.png',
]
for f in files:
    _, o, _ = c.exec_command(f'curl -s -o /dev/null -w "%{{http_code}}" http://127.0.0.1:3002/api/v1/../..{f} 2>/dev/null; echo " {f}"', timeout=10)
    # simpler
    _, o2, _ = c.exec_command(f'curl -s -o /dev/null -w "%{{http_code}}" http://127.0.0.1:3002{f}', timeout=10)
    print(f, '->', o2.read().decode().strip())
_, o3, _ = c.exec_command('ls -la /root/community-backend/backend/data/uploads/ 2>&1 | head -20', timeout=10)
print(o3.read().decode())
_, o4, _ = c.exec_command('find /root/community-backend/backend/data/uploads -name "file-177911*" 2>/dev/null', timeout=10)
print('find:', o4.read().decode())
c.close()
