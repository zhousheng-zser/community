"""Pull service-home backend files from 8.140.204.254 to local repo"""
import paramiko, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SRC = ('8.140.204.254', 'root', 'edS904062')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TMP = os.path.join(os.path.dirname(__file__), '_tmp_sync')

FILES = [
    ('/root/community-backend/backend/src/controllers/adminServiceHomeController.js',
     os.path.join(ROOT, 'backend/src/controllers/adminServiceHomeController.js')),
    ('/root/community-backend/backend/src/models/serviceHomeModule.js',
     os.path.join(ROOT, 'backend/src/models/serviceHomeModule.js')),
    ('/root/community-backend/backend/src/models/category.js',
     os.path.join(ROOT, 'backend/src/models/category.js')),
    ('/root/community-backend/backend/src/models/service.js',
     os.path.join(ROOT, 'backend/src/models/service.js')),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(*SRC, timeout=15, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
os.makedirs(TMP, exist_ok=True)
os.makedirs(os.path.join(ROOT, 'backend/src/controllers'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'backend/src/models'), exist_ok=True)
for remote, local in FILES:
    try:
        sftp.get(remote, local)
        print('OK', os.path.basename(local), os.path.getsize(local))
    except Exception as e:
        print('FAIL', remote, e)
sftp.close()
c.close()
