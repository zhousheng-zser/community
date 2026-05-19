import paramiko, sys

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

# Check if market controller has orderPoints call
pr('=== market.controller.js - orderPoints/grantPoints ===')
out = run("grep -n 'orderPoints\\|grantPoints\\|points' /root/community-backend/backend/src/modules/market/controllers/market.controller.js | head -20")
pr(out)

# Check service order controller
pr('=== serviceOrder.controller.js - orderPoints ===')
out = run("grep -n 'orderPoints\\|grantPoints\\|points' /root/community-backend/backend/src/modules/service-order/controllers/serviceOrder.controller.js | head -10")
pr(out)

# Check neighbor assist controller
pr('=== neighborAssist.controller.js - orderPoints ===')
out = run("grep -n 'orderPoints\\|grantPoints\\|points' /root/community-backend/backend/src/modules/neighbor-assist/controllers/neighborAssist.controller.js | head -10")
pr(out)

s.close()
