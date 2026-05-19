import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command(
    'file /root/community-backend/backend/data/uploads/images/file-1779113700233-627700101.jpg '
    '/root/community-backend/backend/data/uploads/images/file-1779111932094-395868955.png',
    timeout=10
)
print(o.read().decode())
c.close()
