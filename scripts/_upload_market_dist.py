import paramiko, sys, time, os

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=15):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try: out = stdout.read().decode('utf-8', 'ignore')
    except: out = ''
    try: err = stderr.read().decode('utf-8', 'ignore')
    except: err = ''
    return out + err

def pr(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', 'replace'))
    sys.stdout.buffer.flush()

LOCAL_DIST = r'D:\CODE\project\community\market-portal\dist'
REMOTE_DIST = '/var/www/market-merchant-portal/dist'

# Upload dist files
pr('=== Uploading market-portal dist ===')
sftp = s.open_sftp()

# Ensure remote dir exists
run(f"rm -rf {REMOTE_DIST} && mkdir -p {REMOTE_DIST}")

def upload_dir(local_path, remote_path):
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        if os.path.isdir(local_item):
            try: sftp.mkdir(remote_item)
            except: pass
            upload_dir(local_item, remote_item)
        else:
            sftp.put(local_item, remote_item)
            
upload_dir(LOCAL_DIST, REMOTE_DIST)
sftp.close()
pr('  Done')

# Verify
pr('\n=== Verify uploaded files ===')
out = run(f"ls -la {REMOTE_DIST}/")
pr(out)
out = run(f"ls -la {REMOTE_DIST}/assets/ | head -10")
pr(out)

# Restart backend (for route fix)
pr('\n=== Restart backend ===')
run("kill $(pgrep -f 'node src/index.js') 2>/dev/null")
time.sleep(2)
run("cd /root/community-backend/backend && nohup node src/index.js > nohup.out 2>&1 &")
time.sleep(4)
out = run("tail -3 /root/community-backend/backend/nohup.out")
pr(out)

pid = run("pgrep -f 'node src/index.js'").strip()
pr(f'  Backend PID: {pid}')

s.close()
pr('\n=== DONE ===')
