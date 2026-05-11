import paramiko, sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=15)

def run(cmd):
    stdin, stdout, stderr = s.exec_command(cmd)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    sys.stdout.buffer.write(('--- ' + cmd + '\n').encode('utf-8'))
    sys.stdout.buffer.write((out + err).encode('utf-8', 'replace'))
    sys.stdout.buffer.write(b'\n')
    sys.stdout.buffer.flush()

run('curl -s http://127.0.0.1:3001/ | head -c 150')
run('netstat -tlnp 2>/dev/null | awk "/3001|31445|31446/"')
run('ls /var/www/market-merchant-portal/dist/')
run('ls /var/www/service-provider-portal/dist/')
run('curl -s http://127.0.0.1:31445/ | head -c 100')
run('curl -s http://127.0.0.1:31446/ | head -c 100')

s.close()
