"""Deploy service-home alignment to 120.27.239.244"""
import paramiko, os, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = r'd:\CODE\project\community'
HOST, USER, PWD = '120.27.239.244', 'root', 'cW123456'

FILES = [
    ('admin/src/views/ServiceHomeManage.vue', '/root/community-backend/admin/src/views/ServiceHomeManage.vue'),
    ('admin/src/utils/request.js', '/root/community-backend/admin/src/utils/request.js'),
    ('backend/src/routes/adminServiceHome.routes.js', '/root/community-backend/backend/src/routes/adminServiceHome.routes.js'),
    ('backend/src/controllers/adminServiceHomeController.js', '/root/community-backend/backend/src/controllers/adminServiceHomeController.js'),
    ('backend/src/models/serviceHomeModule.js', '/root/community-backend/backend/src/models/serviceHomeModule.js'),
    ('backend/src/models/category.js', '/root/community-backend/backend/src/models/category.js'),
    ('backend/src/models/service.js', '/root/community-backend/backend/src/models/service.js'),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, USER, PWD, timeout=15, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
for local_rel, remote in FILES:
    local = os.path.join(ROOT, local_rel.replace('/', os.sep))
    if os.path.exists(local):
        sftp.put(local, remote)
        print('UP', local_rel)
sftp.close()

def run(cmd):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', 'replace').strip()
    if out: print(out[:1500])
    return stdout.channel.recv_exit_status()

# ensure adminRoutes has service-home (idempotent)
run("""python3 << 'PY'
p='/root/community-backend/backend/src/routes/adminRoutes.js'
t=open(p).read()
if 'adminServiceHomeController' not in t:
    block = '''
const adminServiceHomeController = require('../controllers/adminServiceHomeController');
router.get('/service-home/modules', adminServiceHomeController.listModules);
router.post('/service-home/modules', adminServiceHomeController.createModule);
router.put('/service-home/modules/:id', adminServiceHomeController.updateModule);
router.delete('/service-home/modules/:id', adminServiceHomeController.deleteModule);
router.get('/service-home/categories', adminServiceHomeController.listCategories);
router.post('/service-home/categories', adminServiceHomeController.createCategory);
router.put('/service-home/categories/:id', adminServiceHomeController.updateCategory);
router.delete('/service-home/categories/:id', adminServiceHomeController.deleteCategory);
router.get('/service-home/services', adminServiceHomeController.listServices);
router.post('/service-home/services', adminServiceHomeController.createService);
router.put('/service-home/services/:id', adminServiceHomeController.updateService);
router.delete('/service-home/services/:id', adminServiceHomeController.deleteService);
'''
    t=t.replace('module.exports = router', block+'\\nmodule.exports = router')
    open(p,'w').write(t)
    print('patched adminRoutes')
else:
    print('adminRoutes ok')
PY""")

run('cd /root/community-backend/backend && pm2 restart ecosystem.benefit.pm2.cjs')
time.sleep(2)
run('pm2 restart community-admin')
print('done')
c.close()
