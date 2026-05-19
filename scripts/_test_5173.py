import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
for url in ['http://127.0.0.1:5173/', 'http://127.0.0.1:5173/service-home-manage']:
    cmd = f'curl -s -o /dev/null -w "%{{http_code}}" {url}'
    stdin, stdout, stderr = c.exec_command(cmd, timeout=15)
    print(url, '->', stdout.read().decode().strip())
c.close()
