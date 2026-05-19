import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

patch_script = '''
with open('/root/community-backend/backend/src/controllers/serviceProviderPortalController.js', 'r') as f:
    content = f.read()

old = """    order.fulfillment_meta = { ...meta0, check_ins: checkIns };
    order.changed('fulfillment_meta', true);
    // 到达打卡同时将状态转为服务中
    const allowCheckInTransition = ['paid_pending_dispatch', 'dispatched'];
    if (allowCheckInTransition.includes(order.status)) {
      order.status = 'in_service';
    }
    await order.save();
    const buyerId2 = order.user_id || order.buyer_id;
    if (buyerId2 && allowCheckInTransition.includes(order.status) === false) {
      const orderNo2 = order.order_no || String(order.id);
      pushSpOrderNodeMessage(buyerId2, orderNo2, '服务商已到达', '服务人员已到达您的位置，正在为您提供服务。').catch(() => {});
    }
    return res.json({ errno: 0, data: { id: order.id, status: order.status, check_ins: order.fulfillment_meta.check_ins } });"""

new = """    order.fulfillment_meta = { ...meta0, check_ins: checkIns };
    order.changed('fulfillment_meta', true);
    const prevStatus = order.status;
    if (['paid_pending_dispatch', 'dispatched'].includes(prevStatus)) {
      order.status = 'in_service';
    }
    await order.save();
    if (prevStatus !== order.status) {
      const buyerId2 = order.user_id || order.buyer_id;
      if (buyerId2) {
        const orderNo2 = order.order_no || String(order.id);
        pushSpOrderNodeMessage(buyerId2, orderNo2, '服务商已到达', '服务人员已到达您的位置，正在为您提供服务。').catch(() => {});
      }
    }
    return res.json({ errno: 0, data: { id: order.id, status: order.status, check_ins: order.fulfillment_meta.check_ins } });"""

if old in content:
    content = content.replace(old, new)
    with open('/root/community-backend/backend/src/controllers/serviceProviderPortalController.js', 'w') as f:
        f.write(content)
    print('PATCHED successfully')
else:
    print('Target not found - checking if already has correct version')
    if 'prevStatus !== order.status' in content:
        print('Already patched correctly')
    else:
        print('ERROR: unexpected state')
'''

stdin, stdout, stderr = ssh.exec_command("python3 -c '" + patch_script.replace("'", "'\"'\"'") + "'")
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
print(out)
if err:
    print('STDERR:', err)

ssh.close()
