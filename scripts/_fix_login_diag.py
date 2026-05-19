import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

for host, pwd in [('120.27.239.244', 'cW123456'), ('8.140.204.254', 'edS904062')]:
    print('\n===', host, '===')
    try:
        c = paramiko.SSHClient()
        c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        c.connect(host, 22, 'root', pwd, timeout=10, look_for_keys=False, allow_agent=False)
        for cmd in [
            "getent hosts jshsp1.eds-tech.cn 2>/dev/null || nslookup jshsp1.eds-tech.cn 2>/dev/null | head -6",
            'ls /etc/nginx/sites-enabled/ 2>/dev/null; ls /www/server/panel/vhost/nginx/ 2>/dev/null | head -5',
            "grep -l jshsp1 /etc/nginx/sites-enabled/* /www/server/panel/vhost/nginx/*.conf 2>/dev/null | head -3",
        ]:
            stdin, stdout, stderr = c.exec_command(cmd, timeout=12)
            out = stdout.read().decode('utf-8', 'replace').strip()
            if out: print(cmd[:50], '->', out[:400])
        c.close()
    except Exception as e:
        print('fail', e)
