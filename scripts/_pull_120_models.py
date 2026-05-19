import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
files = [
    '/root/community-backend/backend/src/models/ServiceOrder.js',
    '/root/community-backend/backend/src/routes/workerRoutes.js',
]
sftp = c.open_sftp()
for remote in files:
    local = r'd:\CODE\project\community\backend' + remote.split('/community-backend/backend')[1].replace('/', '\\')
    import os
    os.makedirs(os.path.dirname(local), exist_ok=True)
    try:
        sftp.get(remote, local)
        print('ok', local)
    except Exception as e:
        print('fail', remote, e)
sftp.close()
_, o, _ = c.exec_command("mysql -uroot -pCommunityPwd123! community_db -e \"SHOW COLUMNS FROM service_orders LIKE '%worker%'\" 2>/dev/null", timeout=20)
open(r'd:\CODE\project\community\scripts\_120_out.txt', 'w', encoding='utf-8').write(o.read().decode('utf-8', 'replace'))
c.close()
