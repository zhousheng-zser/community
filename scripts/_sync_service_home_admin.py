"""Sync ServiceHomeManage from 8.140.204.254 -> 120.27.239.244, start admin :5173"""
import paramiko
import os
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SRC_HOST, SRC_USER, SRC_PWD = '8.140.204.254', 'root', 'edS904062'
DST_HOST, DST_USER, DST_PWD = '120.27.239.244', 'root', 'cW123456'
LOCAL_TMP = os.path.join(os.path.dirname(__file__), '_tmp_sync')

FILES = [
    '/root/community-backend/admin/src/views/ServiceHomeManage.vue',
    '/root/community-backend/backend/src/controllers/adminServiceHomeController.js',
    '/root/community-backend/backend/src/models/serviceHomeModule.js',
    '/root/community-backend/backend/src/models/serviceHomeCategory.js',
    '/root/community-backend/backend/src/models/serviceHomeService.js',
]


def connect(host, user, pwd):
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, 22, user, pwd, timeout=15, look_for_keys=False, allow_agent=False)
    return c


def run(c, cmd, timeout=90):
    print(f'  $ {cmd[:90]}')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[:2000])
    if err and code != 0:
        print('[err]', err[:400])
    return code, out, err


def download_all(src_c):
    os.makedirs(LOCAL_TMP, exist_ok=True)
    sftp = src_c.open_sftp()
    local_paths = []
    for rp in FILES:
        name = os.path.basename(rp)
        lp = os.path.join(LOCAL_TMP, name)
        try:
            sftp.get(rp, lp)
            print(f'  DL {name} ({os.path.getsize(lp)} bytes)')
            local_paths.append((lp, rp))
        except Exception as e:
            print(f'  SKIP {name}: {e}')
    sftp.close()
    return local_paths


def upload_all(dst_c, pairs):
    sftp = dst_c.open_sftp()
    for lp, rp in pairs:
        try:
            sftp.put(lp, rp)
            print(f'  UP {os.path.basename(rp)}')
        except Exception as e:
            print(f'  UP FAIL {rp}: {e}')
    sftp.close()


def main():
    print('=== Download from', SRC_HOST, '===')
    src_c = connect(SRC_HOST, SRC_USER, SRC_PWD)
    pairs = download_all(src_c)
    src_c.close()

    print('\n=== Upload to', DST_HOST, '===')
    dst_c = connect(DST_HOST, DST_USER, DST_PWD)
    upload_all(dst_c, pairs)

    # Patch admin router
    print('\n=== Patch admin router/layout ===')
    run(dst_c, '''python3 << 'PY'
p = "/root/community-backend/admin/src/router/index.js"
t = open(p).read()
route = "      { path: 'service-home-manage', name: 'ServiceHomeManage', component: () => import('../views/ServiceHomeManage.vue'), meta: { title: '服务管理' } },\\n"
if "service-home-manage" not in t:
    t = t.replace("{ path: 'dashboard'", route + "      { path: 'dashboard'", 1)
    open(p, "w").write(t)
    print("router: patched")
else:
    print("router: ok")
PY''')

    run(dst_c, '''python3 << 'PY'
p = "/root/community-backend/admin/src/layout/index.vue"
t = open(p).read()
line = '        <el-menu-item index="/service-home-manage">服务管理</el-menu-item>\\n'
if "service-home-manage" not in t:
    t = t.replace('<el-menu-item index="/dashboard">', line + '        <el-menu-item index="/dashboard">', 1)
    open(p, "w").write(t)
    print("layout: patched")
else:
    print("layout: ok")
PY''')

    # Patch adminRoutes
    print('\n=== Patch adminRoutes ===')
    run(dst_c, '''python3 << 'PY'
p = "/root/community-backend/backend/src/routes/adminRoutes.js"
t = open(p).read()
block = """
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
"""
if "adminServiceHomeController" not in t:
    t = t.replace("module.exports = router", block + "\\nmodule.exports = router")
    open(p, "w").write(t)
    print("adminRoutes: patched")
else:
    print("adminRoutes: ok")
PY''')

    # Register models if needed
    run(dst_c, 'grep -n serviceHomeModule /root/community-backend/backend/src/models/index.js 2>/dev/null | head -3')

    print('\n=== Restart backend ===')
    run(dst_c, 'cd /root/community-backend/backend && pm2 restart ecosystem.benefit.pm2.cjs')
    time.sleep(3)

    print('\n=== Start admin vite :5173 ===')
    run(dst_c, 'pm2 delete community-admin 2>/dev/null; true')
    run(dst_c, 'cd /root/community-backend/admin && pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" --name community-admin', timeout=30)
    time.sleep(5)
    run(dst_c, 'pm2 list --no-color')
    run(dst_c, 'ss -tlnp | grep 5173 || echo port5173_not_listening')

  # firewall - user may need security group
    print('\n=== 访问地址 ===')
    print('http://120.27.239.244:5173/service-home-manage')
    print('登录: admin / admin123')
    dst_c.close()


if __name__ == '__main__':
    main()
