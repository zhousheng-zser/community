import paramiko, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = r'd:\CODE\project\community'
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=10, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
files = [
    ('/root/community-backend/backend/src/controllers/coreDataController.js',
     os.path.join(ROOT, 'backend/src/controllers/coreDataController.js')),
    ('/root/community-backend/backend/src/routes/coreDataRoutes.js',
     os.path.join(ROOT, 'backend/src/routes/coreDataRoutes.js')),
    ('/root/community-backend/backend/src/middlewares/adminAuthMiddleware.js',
     os.path.join(ROOT, 'backend/src/middlewares/adminAuthMiddleware.js')),
    ('/root/community-backend/admin/src/utils/request.js',
     os.path.join(ROOT, 'admin/src/utils/request.js')),
]
os.makedirs(os.path.join(ROOT, 'backend/src/controllers'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'backend/src/routes'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'backend/src/middlewares'), exist_ok=True)
for r, l in files:
    try:
        sftp.get(r, l)
        print('OK', os.path.basename(l))
    except Exception as e:
        print('FAIL', l, e)
sftp.close()
c.close()
