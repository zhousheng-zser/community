import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
for cmd in [
    'grep -n upload /root/community-backend/backend/src/index.js | head -15',
    'test -f /root/community-backend/backend/src/middlewares/adminAuthMiddleware.js && head -40 /root/community-backend/backend/src/middlewares/adminAuthMiddleware.js',
    'grep -n getServiceHomeModules /root/community-backend/backend/src/controllers/coreDataController.js | head -5',
]:
    stdin, stdout, stderr = c.exec_command(cmd, timeout=15)
    print('>>>', cmd[:60])
    print(stdout.read().decode('utf-8', 'replace')[:2000])
    print()
c.close()
