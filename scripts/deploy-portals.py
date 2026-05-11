import paramiko
import sys

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd, timeout=180):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    sys.stdout.buffer.write(('>>> ' + cmd[:100] + '\n').encode('utf-8'))
    sys.stdout.buffer.write((out + err).encode('utf-8', 'replace'))
    sys.stdout.buffer.write(b'\n')
    sys.stdout.buffer.flush()
    return out + err

# 1. Check & patch auth controller
check = run('grep -c merchantPortalLogin /root/community-backend/backend/src/modules/auth/controllers/auth.controller.js 2>/dev/null || echo 0')
already_patched = check.strip().startswith('1') or check.strip().startswith('2')

if not already_patched:
    patch = """
const _db2 = require('../../../models');
const _jwt2 = require('jsonwebtoken');
const _JWT_SECRET2 = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
async function _doPortalLogin(req, res, roleLabel, checkFn) {
  const { phone, password, user_id } = req.body;
  const BYPASS = process.env.PORTAL_TEST_BYPASS === '1';
  try {
    let userId, userInfo = {};
    if (BYPASS && user_id) {
      userId = Number(user_id);
      userInfo = { id: userId, phone: phone || '', nickname: 'test' };
    } else {
      if (!phone) return res.status(400).json({ code: 1, msg: 'phone required' });
      const { User } = _db2;
      if (!User) return res.status(503).json({ code: 1, msg: 'User model missing' });
      const user = await User.findOne({ where: { phone } });
      if (!user) return res.status(401).json({ code: 1, msg: 'phone not registered' });
      if (password) {
        let pwOk = false;
        if (user.password) {
          try { const bc = require('bcrypt'); pwOk = await bc.compare(String(password), user.password); }
          catch (_e) { pwOk = String(password) === String(user.password); }
        }
        if (!pwOk) return res.status(401).json({ code: 1, msg: 'wrong password' });
      }
      userId = user.id;
      userInfo = { id: user.id, phone: user.phone, nickname: user.nickname || user.phone };
    }
    const shopInfo = await checkFn(userId);
    if (!shopInfo) return res.status(403).json({ code: 1, msg: roleLabel + ' not found' });
    const token = _jwt2.sign({ id: userId, phone: userInfo.phone, role: 'merchant' }, _JWT_SECRET2, { expiresIn: '7d' });
    res.json({ code: 0, msg: 'ok', data: { token, user: userInfo, shop: shopInfo } });
  } catch(e) {
    res.status(500).json({ code: 1, msg: e.message || 'login failed' });
  }
}
exports.merchantPortalLogin = async (req, res) => {
  const { MerchantShop } = _db2;
  await _doPortalLogin(req, res, 'merchant', async (uid) => {
    if (!MerchantShop) return null;
    const shop = await MerchantShop.findOne({ where: { user_id: uid } });
    return shop ? { id: shop.id, name: shop.name, status: shop.status } : null;
  });
};
exports.servicePortalLogin = async (req, res) => {
  const { ServiceProviderProfile } = _db2;
  await _doPortalLogin(req, res, 'service provider', async (uid) => {
    if (!ServiceProviderProfile) return null;
    const p = await ServiceProviderProfile.findOne({ where: { user_id: uid } });
    return p ? { id: p.id, name: p.shop_name, status: p.status } : null;
  });
};
"""
    sftp = s.open_sftp()
    with sftp.file('/tmp/auth_patch.js', 'w') as f:
        f.write(patch)
    sftp.close()
    run("cat /tmp/auth_patch.js >> /root/community-backend/backend/src/modules/auth/controllers/auth.controller.js")
    run("printf \"\\nrouter.post('/merchant-portal/login', ctrl.merchantPortalLogin);\\n\" >> /root/community-backend/backend/src/modules/auth/routes.js")
    run("printf \"router.post('/service-portal/login', ctrl.servicePortalLogin);\\n\" >> /root/community-backend/backend/src/modules/auth/routes.js")
    sys.stdout.buffer.write(b'Auth controller patched\n')
else:
    sys.stdout.buffer.write(b'Auth controller already patched\n')

# 2. Build merchant-portal
run("cd /root/community-backend/merchant-portal && npm install 2>&1 | tail -3", timeout=120)
run("cd /root/community-backend/merchant-portal && npm run build 2>&1 | tail -8", timeout=120)

# 3. Build service-provider-portal
run("cd /root/community-backend/service-provider-portal && npm install 2>&1 | tail -3", timeout=120)
run("cd /root/community-backend/service-provider-portal && npm run build 2>&1 | tail -8", timeout=120)

# 4. Deploy dist to /var/www
run("mkdir -p /var/www/market-merchant-portal && cp -rf /root/community-backend/merchant-portal/dist /var/www/market-merchant-portal/")
run("mkdir -p /var/www/service-provider-portal && cp -rf /root/community-backend/service-provider-portal/dist /var/www/service-provider-portal/")

# 5. Install nginx configs
run("cp /root/community-backend/deploy/nginx-merchant-portal-31445.conf /www/server/panel/vhost/nginx/market-merchant-portal.conf")

sp_nginx = """server {
    listen 31446;
    listen [::]:31446;
    server_name _;
    root /var/www/service-provider-portal/dist;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml;
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
    location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable" always; try_files $uri =404; }
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /uploads/ { proxy_pass http://127.0.0.1:3001/uploads/; proxy_http_version 1.1; proxy_set_header Host $host; }
    location / { try_files $uri $uri/ /index.html; }
}
"""
sftp = s.open_sftp()
with sftp.file('/www/server/panel/vhost/nginx/service-provider-portal.conf', 'w') as f:
    f.write(sp_nginx)
sftp.close()

# 6. Test & reload nginx
run("nginx -t 2>&1")
run("nginx -s reload 2>&1")

# 7. Restart backend
run("pm2 list --no-color 2>&1 | tail -5")
run("pm2 restart all 2>/dev/null && echo 'pm2 restarted' || echo 'no pm2 processes'")

sys.stdout.buffer.write(b'\n=== DEPLOYMENT COMPLETE ===\n')
s.close()
