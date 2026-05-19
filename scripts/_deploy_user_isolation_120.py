"""部署用户隔离修复到 120"""
import paramiko, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '120.27.239.244'
REMOTE = '/root/community-backend/backend'
LOCAL = os.path.join(os.path.dirname(__file__), '..', 'backend')

FILES = [
    'src/utils/resolveUserId.js',
    'src/middlewares/authMiddleware.js',
    'src/routes/userRoutes.js',
    'src/controllers/authController.js',
    'src/controllers/userController.js',
    'src/controllers/neighborAssistController.js',
    'src/services/orderPoints.service.js',
    'src/modules/user/controllers/user.controller.js',
    'src/modules/market/controllers/market.controller.js',
    'src/modules/coupon/controllers/coupon.controller.js',
    'src/modules/service-order/controllers/serviceOrder.controller.js',
    'src/modules/neighbor-assist/controllers/neighborAssist.controller.js',
    'src/modules/worker/controllers/worker.controller.js',
    'src/modules/merchant/controllers/merchant.controller.js',
    'src/modules/message/controllers/message.controller.js',
    'src/modules/service-provider-portal/controllers/serviceProvider.controller.js',
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

for rel in FILES:
    lp = os.path.normpath(os.path.join(LOCAL, rel.replace('/', os.sep)))
    rp = REMOTE + '/' + rel.replace('\\', '/')
    sftp.put(lp, rp)
    print('[OK]', rel)

sftp.close()

def run(cmd):
    _, o, e = c.exec_command(cmd, timeout=25)
    return o.read().decode('utf-8', 'replace').strip()

run('pkill -f "node src/index.js" || true')
time.sleep(2)
run(f'cd {REMOTE} && nohup node src/index.js >> nohup.out 2>&1 &')
time.sleep(4)
print('proc:', run('pgrep -af "node src/index.js"'))
print('health:', run('curl -s http://127.0.0.1:3002/')[:120])
c.close()
print('\n[DONE] 已部署并重启')
