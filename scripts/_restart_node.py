import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Kill and restart in background
stdin, stdout, stderr = ssh.exec_command('pkill -f "node src/index.js"')
stdout.read()
time.sleep(2)

stdin, stdout, stderr = ssh.exec_command('cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 &')
stdout.channel.recv_exit_status()
time.sleep(2)

# Verify
stdin, stdout, stderr = ssh.exec_command('ps aux | grep "node src/index" | grep -v grep')
out = stdout.read().decode().strip()
print('Running:', out)

ssh.close()
print('Backend restarted')
