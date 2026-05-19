#!/usr/bin/env python3
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=15, look_for_keys=False, allow_agent=False)
cmds = [
    "mysql -uroot -pCommunityPwd123! community_db -e \"SHOW TABLES LIKE '%benefit%';\" 2>/dev/null",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT platform, COUNT(*) c, SUM(status='active') act FROM benefit_alliance_goods WHERE scene='benefit_card' GROUP BY platform;\" 2>/dev/null",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT id, platform, LEFT(title,30), LEFT(spread_url,55), status FROM benefit_alliance_goods WHERE scene='benefit_card' ORDER BY platform, sort_order;\" 2>/dev/null",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT COUNT(*) FROM jd_benefit_goods;\" 2>/dev/null",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT id, sku_id, LEFT(spread_url,50), status FROM jd_benefit_goods LIMIT 15;\" 2>/dev/null",
    "mysql -uroot -pCommunityPwd123! community_db -e \"SELECT COUNT(*) FROM pdd_benefit_goods;\" 2>/dev/null",
    # delete empty spread or inactive duplicates with bad kzurl variants
    """mysql -uroot -pCommunityPwd123! community_db -e "
DELETE FROM benefit_alliance_goods WHERE scene='benefit_card' AND (spread_url IS NULL OR TRIM(spread_url)='');
UPDATE benefit_alliance_goods SET status='inactive' WHERE scene='benefit_card' AND spread_url LIKE '%kzurl%' AND spread_url REGEXP 'kzurl[a-z]*G\\.cn';
" 2>/dev/null""",
]
out = []
for cmd in cmds:
    _, o, _ = c.exec_command(cmd, timeout=25)
    out.append('=== ' + cmd[:60])
    out.append(o.read().decode('utf-8', 'replace'))
c.close()
open(r'd:\CODE\project\community\scripts\_benefit_audit_out.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('done')
