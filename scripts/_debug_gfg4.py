import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

cmds = [
    'cat /root/community-backend/backend/src/models/index.js',
    'grep -rn "service-home-modules\\|getServiceHomeModules" /root/community-backend/backend/src --include="*.js" | head -15',
    'head -25 /root/community-backend/backend/src/controllers/coreDataController.js',
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=25)
    print('===', cmd[:70])
    print(o.read().decode('utf-8', 'replace')[:2500])
c.close()
