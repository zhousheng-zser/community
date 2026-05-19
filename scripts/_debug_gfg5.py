import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=12, look_for_keys=False, allow_agent=False)

script = r'''
cd /root/community-backend/backend && node <<'NODE'
const db = require('./src/models');
console.log('ServiceHomeModule', !!db.ServiceHomeModule);
if (db.ServiceHomeModule) {
  db.ServiceHomeModule.findOne({ where: { group_key: 'gfg', is_active: 1 } })
    .then(r => console.log('findOne gfg', r && r.toJSON()))
    .catch(e => console.error('err', e.message));
  db.ServiceHomeModule.findAll({ where: { is_active: 1 } })
    .then(r => console.log('findAll count', r.length))
    .catch(e => console.error('findAll err', e.message));
} else {
  console.log('keys', Object.keys(db).filter(k => /service/i.test(k)));
}
setTimeout(() => process.exit(0), 3000);
NODE
'''
_, o, e = c.exec_command(script, timeout=30)
out = o.read().decode('utf-8', 'replace')
err = e.read().decode('utf-8', 'replace')
open(r'd:\CODE\project\community\scripts\_debug_gfg5_out.txt', 'w', encoding='utf-8').write(out + '\n' + err)
print('written', len(out))
c.close()
