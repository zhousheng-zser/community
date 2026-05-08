import subprocess, os, time

# Kill existing
r = subprocess.run(['bash', '-c', 'pkill -f "node src/index.js"; sleep 1'], capture_output=True)
print('kill result:', r.returncode)

# Start new
r2 = subprocess.run(
    ['bash', '-c', 'cd /home/cw/a/community-backend/backend && nohup node src/index.js >> /tmp/community-backend.log 2>&1 &'],
    capture_output=True
)
print('start result:', r2.returncode, r2.stdout.decode(), r2.stderr.decode())
time.sleep(2)

# Check
r3 = subprocess.run(['bash', '-c', 'pgrep -f "node src/index.js"'], capture_output=True)
print('pgrep:', r3.stdout.decode().strip())
