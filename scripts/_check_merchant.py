import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Read applyOrderAction logic (around line 936)
stdin, stdout, stderr = ssh.exec_command("sed -n '936,990p' /root/community-backend/backend/src/controllers/merchantPortalController.js 2>/dev/null")
out = stdout.read().decode('utf-8', errors='replace').strip()
print(out)

ssh.close()
