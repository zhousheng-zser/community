#!/usr/bin/env python3
"""Restore valid benefit rows mistakenly removed; verify shequn."""
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=15, look_for_keys=False, allow_agent=False)

sql = r"""
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('shangou', '饿了么消费日', '饿了么21城消费日活动', 'https://kzurlOG.cn/tOAtjX', '/uploads/benefit/shangou-6.png', 20.00, 0.00, 1.50, 'active', 'benefit_card', 6, NOW(), NOW()),
('tuixiao', '美团会员', '白银会员权益X机票火车票', 'https://kzurlog.cn/toA3mo', '/uploads/benefit/tuixiao-3.png', 30.00, 15.00, 2.00, 'active', 'benefit_card', 3, NOW(), NOW()),
('tuixiao', '送你券包', '最高可领100元券包', 'https://kzurll5.cn/tOA3cB', '/uploads/benefit/tuixiao-4.png', 100.00, 0.00, 5.00, 'active', 'benefit_card', 4, NOW(), NOW()),
('shequn', '社群专享福利', '社群专享。9.9元吃饱喝足', 'https://kzurllo.cn/toAtmy', '/uploads/benefit/shequn-1.png', 19.90, 9.90, 1.00, 'active', 'benefit_card', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE status='active';
"""
# shequn may not have unique key - use simple insert if not exists
check = "SELECT COUNT(*) FROM benefit_alliance_goods WHERE scene='benefit_card' AND platform='shequn';"
_, o, _ = c.exec_command(f"mysql -uroot -pCommunityPwd123! community_db -N -e \"{check}\" 2>/dev/null", timeout=15)
shequn_cnt = o.read().decode().strip()

cmds = []
if shequn_cnt == '0':
    cmds.append("""INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES ('shequn', '社群专享福利', '社群专享。9.9元吃饱喝足', 'https://kzurllo.cn/toAtmy', '/uploads/benefit/shequn-1.png', 19.90, 9.90, 1.00, 'active', 'benefit_card', 1, NOW(), NOW());""")

cmds.append("""INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at)
SELECT 'shangou','饿了么消费日','饿了么21城消费日活动','https://kzurlOG.cn/tOAtjX','/uploads/benefit/shangou-6.png',20,0,1.5,'active','benefit_card',6,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM benefit_alliance_goods WHERE scene='benefit_card' AND platform='shangou' AND spread_url LIKE '%tOAtjX%');""")

cmds.append("""INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at)
SELECT 'tuixiao','美团会员','白银会员权益X机票火车票','https://kzurlog.cn/toA3mo','/uploads/benefit/tuixiao-3.png',30,15,2,'active','benefit_card',3,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM benefit_alliance_goods WHERE scene='benefit_card' AND platform='tuixiao' AND spread_url LIKE '%toA3mo%');""")

cmds.append("""INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at)
SELECT 'tuixiao','送你券包','最高可领100元券包','https://kzurll5.cn/tOA3cB','/uploads/benefit/tuixiao-4.png',100,0,5,'active','benefit_card',4,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM benefit_alliance_goods WHERE scene='benefit_card' AND platform='tuixiao' AND spread_url LIKE '%tOA3cB%');""")

for cmd in cmds:
    _, o, e = c.exec_command(f'mysql -uroot -pCommunityPwd123! community_db -e "{cmd}" 2>&1', timeout=20)
    print(o.read().decode('utf-8', 'replace')[:100])

_, o, _ = c.exec_command("mysql -uroot -pCommunityPwd123! community_db -e \"SELECT platform, COUNT(*) FROM benefit_alliance_goods WHERE scene='benefit_card' AND status='active' GROUP BY platform;\" 2>/dev/null", timeout=15)
print(o.read().decode('utf-8', 'replace'))
c.close()
