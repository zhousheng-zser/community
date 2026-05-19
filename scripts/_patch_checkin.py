import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

# Patch orderCheckIn to also change status to in_service
patch_script = r"""
import re
import sys

with open('/root/community-backend/backend/src/controllers/serviceProviderPortalController.js', 'r') as f:
    content = f.read()

# Find the orderCheckIn method and add status change after saving check-in data
old = '''    order.fulfillment_meta = { ...meta0, check_ins: checkIns };
    order.changed('fulfillment_meta', true);
    await order.save();
    return res.json({ errno: 0, data: { id: order.id, check_ins: order.fulfillment_meta.check_ins } });'''

new = '''    order.fulfillment_meta = { ...meta0, check_ins: checkIns };
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
    return res.json({ errno: 0, data: { id: order.id, status: order.status, check_ins: order.fulfillment_meta.check_ins } });'''

if old in content:
    content = content.replace(old, new)
    with open('/root/community-backend/backend/src/controllers/serviceProviderPortalController.js', 'w') as f:
        f.write(content)
    print('PATCHED orderCheckIn successfully')
else:
    print('ERROR: Could not find target string in orderCheckIn')
    # Let's try to find it with more context
    idx = content.find('check_ins: checkIns')
    if idx > 0:
        print('Found check_ins at position', idx)
        print('Context:', content[idx-50:idx+200])
    else:
        print('check_ins: checkIns not found at all')
"""

stdin, stdout, stderr = ssh.exec_command(f'python3 -c """{patch_script}"""')
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
print(out)
if err:
    print('STDERR:', err)

ssh.close()
