import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command('ls /root/community-backend/backend/data/uploads/images/service_home3/ 2>&1 | head -15', timeout=10)
print('service_home3:', o.read().decode())
for path in ['/uploads/file-1779113700233-627700101.jpg']:
    _, o2, _ = c.exec_command(f'curl -sk -o /dev/null -w "%{{http_code}}" https://127.0.0.1:3001{path}', timeout=10)
    print('https3001', path, o2.read().decode().strip())
c.close()
