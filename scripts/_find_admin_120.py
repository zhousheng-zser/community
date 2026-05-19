import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=12, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command('find /root -name ServiceDispatch.vue 2>/dev/null | head -5; ls -d /root/*admin* 2>/dev/null', timeout=20)
open(r'd:\CODE\project\community\scripts\_deploy_120_out.txt', 'w', encoding='utf-8').write(o.read().decode('utf-8', 'replace'))
c.close()
