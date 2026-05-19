import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Check if there's a generic /action route in the service provider portal routes
stdin, stdout, stderr = ssh.exec_command("grep -n 'action' /root/community-backend/backend/src/routes/serviceProviderPortalRoutes.js 2>/dev/null")
out = stdout.read().decode('utf-8', errors='replace').strip()
print('Action routes:', out)

# Also check the orderAction handler (generic dispatcher)
stdin, stdout, stderr = ssh.exec_command("sed -n '895,910p' /root/community-backend/backend/src/controllers/serviceProviderPortalController.js 2>/dev/null")
out = stdout.read().decode('utf-8', errors='replace').strip()
print('\nAction dispatcher:')
print(out)

ssh.close()
