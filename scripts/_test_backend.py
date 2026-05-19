import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Read start-service and complete methods
stdin, stdout, stderr = ssh.exec_command("sed -n '780,880p' /root/community-backend/backend/src/controllers/serviceProviderPortalController.js")
out = stdout.read().decode('utf-8', errors='replace').strip()
print(out)

ssh.close()
