import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

print(run('pgrep -af node'))
print('ports:', run('ss -lntp | grep -E "3001|3002"'))
print('health:', run('curl -sk https://120.27.239.244:3001/api/v1/core/workers?page=1 | head -c 300'))
wid = '313949215095001091'
print('worker:', run(f'curl -sk https://120.27.239.244:3001/api/v1/core/workers/{wid}'))
c.close()
