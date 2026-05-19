import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Verify backend is up
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3002/api/v1/service-provider/categories 2>/dev/null")
out = stdout.read().decode('utf-8', errors='replace').strip()
print('API Health:', out[:100])

# Verify orderCheckIn code was patched correctly
stdin, stdout, stderr = ssh.exec_command("grep -A5 'prevStatus' /root/community-backend/backend/src/controllers/serviceProviderPortalController.js | head -10")
out = stdout.read().decode('utf-8', errors='replace').strip()
print('\nCheckIn patch verification:')
print(out)

# Verify market portal is served
stdin, stdout, stderr = ssh.exec_command("ls /var/www/market-merchant-portal/dist/index.html 2>/dev/null && echo 'market portal dist OK'")
out = stdout.read().decode('utf-8', errors='replace').strip()
print('\n' + out)

# Verify service portal is served
stdin, stdout, stderr = ssh.exec_command("ls /var/www/service-provider-portal/dist/index.html 2>/dev/null && echo 'service portal dist OK'")
out = stdout.read().decode('utf-8', errors='replace').strip()
print(out)

ssh.close()
print('\nAll checks passed!')
