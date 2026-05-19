import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Check running node processes
stdin, stdout, stderr = ssh.exec_command('ps aux | grep node | grep -v grep')
print('Running node processes:')
print(stdout.read().decode().strip())

# Check if there's a process manager
stdin, stdout, stderr = ssh.exec_command('cat /root/community-backend/ecosystem.config.js 2>/dev/null || echo "no ecosystem"')
print('\nEcosystem config:')
print(stdout.read().decode().strip())

ssh.close()
