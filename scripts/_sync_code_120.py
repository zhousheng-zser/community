#!/usr/bin/env python3
"""双向同步：本地 → 120 部署；120 → 本地拉取 adminRoutes 等线上文件"""
import os
import sys
import time
import paramiko

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
HOST, USER, PWD = '120.27.239.244', 'root', 'cW123456'
REMOTE_BACKEND = '/root/community-backend/backend'
REMOTE_ADMIN = '/root/community-backend/admin'

# 本地 → 120（业务代码，不含 scripts）
UPLOAD = [
    ('admin/src/views/ServiceHomeManage.vue', f'{REMOTE_ADMIN}/src/views/ServiceHomeManage.vue'),
    ('admin/src/views/ServiceDispatch.vue', f'{REMOTE_ADMIN}/src/views/ServiceDispatch.vue'),
    ('admin/src/utils/request.js', f'{REMOTE_ADMIN}/src/utils/request.js'),
    ('backend/src/controllers/adminServiceHomeController.js', f'{REMOTE_BACKEND}/src/controllers/adminServiceHomeController.js'),
    ('backend/src/controllers/coreDataController.js', f'{REMOTE_BACKEND}/src/controllers/coreDataController.js'),
    ('backend/src/controllers/adminDispatchController.js', f'{REMOTE_BACKEND}/src/controllers/adminDispatchController.js'),
    ('backend/src/controllers/serviceOrderController.js', f'{REMOTE_BACKEND}/src/controllers/serviceOrderController.js'),
    ('backend/src/controllers/workerPortalController.js', f'{REMOTE_BACKEND}/src/controllers/workerPortalController.js'),
    ('backend/src/modules/benefit-card/controllers/benefitAlliance.controller.js',
     f'{REMOTE_BACKEND}/src/modules/benefit-card/controllers/benefitAlliance.controller.js'),
    ('backend/src/models/serviceHomeModule.js', f'{REMOTE_BACKEND}/src/models/serviceHomeModule.js'),
    ('backend/src/models/category.js', f'{REMOTE_BACKEND}/src/models/category.js'),
    ('backend/src/models/service.js', f'{REMOTE_BACKEND}/src/models/service.js'),
    ('backend/src/models/user.js', f'{REMOTE_BACKEND}/src/models/user.js'),
    ('backend/src/routes/adminServiceHome.routes.js', f'{REMOTE_BACKEND}/src/routes/adminServiceHome.routes.js'),
    ('backend/src/routes/coreDataRoutes.js', f'{REMOTE_BACKEND}/src/routes/coreDataRoutes.js'),
    ('backend/sql/cleanup_invalid_benefit_goods.sql', f'{REMOTE_BACKEND}/sql/cleanup_invalid_benefit_goods.sql'),
    ('doc/服务管理_后台接口与设计.md', f'{REMOTE_BACKEND}/../doc/服务管理_后台接口与设计.md'),
]

# 120 → 本地（线上独有）
PULL = [
    (f'{REMOTE_BACKEND}/src/routes/adminRoutes.js', 'backend/src/routes/adminRoutes.js'),
]


def ensure_dir(sftp, remote_path):
    d = os.path.dirname(remote_path).replace('\\', '/')
    parts = d.split('/')
    cur = ''
    for p in parts:
        if not p:
            continue
        cur += '/' + p
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            try:
                sftp.mkdir(cur)
            except OSError:
                pass


def main():
    log = []
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, USER, PWD, timeout=20, look_for_keys=False, allow_agent=False)
    sftp = c.open_sftp()

    log.append('=== 120 → 本地 ===')
    for remote, rel in PULL:
        local = os.path.join(ROOT, rel.replace('/', os.sep))
        os.makedirs(os.path.dirname(local), exist_ok=True)
        try:
            sftp.get(remote, local)
            log.append(f'  OK pull {rel} ({os.path.getsize(local)} bytes)')
        except Exception as e:
            log.append(f'  SKIP pull {rel}: {e}')

    log.append('=== 本地 → 120 ===')
    n_up = 0
    for rel, remote in UPLOAD:
        local = os.path.join(ROOT, rel.replace('/', os.sep))
        if not os.path.isfile(local):
            log.append(f'  SKIP missing {rel}')
            continue
        ensure_dir(sftp, remote)
        sftp.put(local, remote)
        n_up += 1
        log.append(f'  OK upload {rel}')

    sftp.close()

    _, o, _ = c.exec_command(
        "grep -q adminServiceHomeController /root/community-backend/backend/src/routes/adminRoutes.js "
        "&& echo 'adminRoutes ok' || echo 'adminRoutes NEED PATCH'",
        timeout=15
    )
    log.append('adminRoutes: ' + o.read().decode('utf-8', 'replace').strip())

    _, o, _ = c.exec_command(
        'cd /root/community-backend/backend && pm2 restart ecosystem.benefit.pm2 2>/dev/null; '
        'pm2 restart community-admin 2>/dev/null; sleep 3; pm2 list | head -8',
        timeout=45
    )
    log.append('pm2:\n' + o.read().decode('utf-8', 'replace')[:600])

    c.close()
    out_path = os.path.join(ROOT, 'scripts', '_sync_code_120_out.txt')
    text = '\n'.join(log) + f'\n\n上传 {n_up} 个文件'
    open(out_path, 'w', encoding='utf-8').write(text)
    print(text)


if __name__ == '__main__':
    main()
