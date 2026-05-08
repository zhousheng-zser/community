#!/usr/bin/env python3
import subprocess

HOST = 'cw@192.168.110.50'
path = '/home/cw/a/community-backend/backend/src/controllers/serviceOrderController.js'

script = r"""
path = '/home/cw/a/community-backend/backend/src/controllers/serviceOrderController.js'
with open(path) as f:
    c = f.read()

# Fix 1: lookup by profile id, not user_id
old1 = "where: { user_id: parseInt(provider_id, 10), status: 'active' }"
new1 = "where: { id: parseInt(provider_id, 10), status: 'active' }"

# Fix 2: use prof.user_id for provider_user_id
old2 = 'provider_user_id: parseInt(provider_id, 10),'
new2 = 'provider_user_id: prof.user_id || parseInt(provider_id, 10),'

changed = False
if old1 in c:
    c = c.replace(old1, new1)
    changed = True
    print('Fix 1 applied: lookup by id')
else:
    print('Fix 1 already applied or pattern changed')

if old2 in c:
    c = c.replace(old2, new2)
    changed = True
    print('Fix 2 applied: use prof.user_id')
else:
    print('Fix 2 already applied or pattern changed')

if changed:
    with open(path, 'w') as f:
        f.write(c)
    print('File saved.')
"""

r = subprocess.run(
    ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST,
     f"python3 << 'PYEOF'\n{script}\nPYEOF"],
    capture_output=True, text=True, encoding='utf-8', errors='replace'
)
print(r.stdout)
if r.stderr: print('ERR:', r.stderr[:300])
