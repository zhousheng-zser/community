"""部署优惠券功能到 120 并执行 SQL"""
import os, sys, time, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCAL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REMOTE = '/root/community-backend/backend'

FILES = [
    'backend/src/modules/coupon/services/coupon.service.js',
    'backend/src/modules/coupon/controllers/coupon.controller.js',
    'backend/src/modules/coupon/routes.js',
    'backend/src/modules/coupon/models/CouponTemplate.js',
    'backend/src/modules/coupon/models/CouponIssue.js',
    'backend/src/routes/couponRoutes.js',
    'backend/src/controllers/serviceOrderController.js',
    'backend/src/controllers/authController.js',
    'backend/src/index.js',
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()

for rel in FILES:
    local = os.path.join(LOCAL, rel.replace('/', os.sep))
    remote = f'{REMOTE}/{rel.split("backend/", 1)[1]}'
    os.makedirs(os.path.dirname(remote.replace(REMOTE, LOCAL)), exist_ok=True)
    sftp.put(local, remote)
    print(f'[OK] {rel}')

sftp.close()

def run(cmd, t=20):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace').strip()

# SQL
sql_path = os.path.join(LOCAL, 'backend', 'sql', '0433_welcome_coupon_100_20.sql')
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()
_, so, _ = c.exec_command('cat > /tmp/0433_coupon.sql', timeout=5)
so.channel.send(sql.encode('utf-8'))
so.channel.shutdown_write()
so.read()
print('\n=== SQL ===')
print(run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/0433_coupon.sql 2>&1'))
print(run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db -e "SELECT code,name,discount_amount,threshold_amount FROM coupon_templates WHERE code LIKE \'WELCOME%\';" 2>&1'))

# 建表（若不存在）
init_sql = os.path.join(LOCAL, 'backend', 'sql', '0431_coupon_system.sql')
with open(init_sql, 'r', encoding='utf-8') as f:
    init = f.read()
_, so, _ = c.exec_command('cat > /tmp/0431_coupon.sql', timeout=5)
so.channel.send(init.encode('utf-8'))
so.channel.shutdown_write()
so.read()
run('MYSQL_PWD="CommunityPwd123!" mysql -uroot community_db < /tmp/0431_coupon.sql 2>&1')

# 重启
run('pkill -9 -f "node src/index.js" || true')
time.sleep(2)
c.exec_command('setsid bash -c "cd /root/community-backend/backend && node src/index.js >> nohup.out 2>&1" &')
time.sleep(5)
print('\n进程:', run('pgrep -af "node src/index.js"'))

# 健康检查（无需登录的 list 会 401，只测路由存在）
print('\n路由测试 coupons/list:', run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/v1/coupons/list'))
print('路由测试 service-orders:', run('curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:3002/api/v1/service-orders'))

c.close()
print('\n[DONE]')
