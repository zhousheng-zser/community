import paramiko, sys, time, io

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

ROUTES_FILE = '/root/community-backend/backend/src/routes/merchantPortalRoutes.js'

# Read current content
pr('=== Reading routes file ===')
content = run(f"cat {ROUTES_FILE}")

# Fix: replace the complete-delivery action from 'delivered' to 'complete'
old = """router.post('/orders/:orderNo/complete-delivery', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'delivered' };"""
new = """router.post('/orders/:orderNo/complete-delivery', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'complete' };"""

if old in content:
    content = content.replace(old, new)
    pr('  Replaced delivered -> complete')
else:
    pr('  Pattern not found, trying alternate...')
    # Try with different quote style or spacing
    content = content.replace("action: 'delivered' };\n  return ctrl.applyOrderAction(req, res, next);\n});\nrouter.get('/payments'",
                              "action: 'complete' };\n  return ctrl.applyOrderAction(req, res, next);\n});\nrouter.get('/payments'")

# Write back
sftp = s.open_sftp()
f = io.BytesIO(content.encode('utf-8'))
sftp.putfo(f, ROUTES_FILE)
sftp.close()
pr('  Written back')

# Verify
pr('\n=== Verify ===')
out = run(f"grep -n 'complete' {ROUTES_FILE}")
pr(out)

# Find where market-portal build output goes
pr('\n=== Find market-portal location on server ===')
out = run("find /root/community-backend -type d -name 'market-portal' 2>/dev/null | head -5")
pr(out)

# Check if it's a separate dir or inside backend
out = run("ls /root/community-backend/market-portal/src/views/ 2>/dev/null || echo 'NOT FOUND'")
pr(f'  market-portal views: {out.strip()}')

out = run("ls /root/market-portal/src/views/ 2>/dev/null || echo 'NOT FOUND at /root'")
pr(f'  /root/market-portal: {out.strip()}')

# Find where market portal actually is
out = run("find / -path '*/market-portal/src/views/Orders.vue' 2>/dev/null")
pr(f'  Orders.vue location: {out.strip()}')

s.close()
