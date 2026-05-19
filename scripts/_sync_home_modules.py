#!/usr/bin/env python3
"""Sync service_home_modules from 120 to 8140 (jshsp1 API DB)."""
import json
import paramiko

HOST_120 = ('120.27.239.244', 'cW123456')
HOST_8140 = ('8.140.204.254', 'edS904062')
MYSQL_CMDS = [
    'mysql -uroot -pCommunityPwd123! community_db -N -e "SELECT COUNT(*) FROM service_home_modules" 2>/dev/null',
    'mysql -uroot community_db -N -e "SELECT COUNT(*) FROM service_home_modules" 2>/dev/null',
    'mysql -uroot community -N -e "SELECT COUNT(*) FROM service_home_modules" 2>/dev/null',
]


def ssh_run(host, pwd, cmd, timeout=60):
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, 22, 'root', pwd, timeout=15, look_for_keys=False, allow_agent=False)
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', 'replace')
    err = e.read().decode('utf-8', 'replace')
    c.close()
    return out.strip(), err.strip()


def mysql_query(host, pwd, sql):
    esc = sql.replace('"', '\\"')
    for db_pass in ['CommunityPwd123!', '']:
        for db in ['community_db', 'community']:
            pw = f'-p{db_pass}' if db_pass else ''
            cmd = f'mysql -uroot {pw} {db} -N -e "{esc}" 2>/dev/null'
            out, err = ssh_run(host, pwd, cmd)
            if out and 'ERROR' not in out.upper():
                return out, db, db_pass
    return '', None, None


def main():
    sql_list = (
        'SELECT id,group_key,title,icon_url,price_unit,sort_order,is_active '
        'FROM service_home_modules ORDER BY sort_order,id'
    )
    raw, db120, _ = mysql_query(HOST_120[0], HOST_120[1], sql_list)
    print('120 db:', db120)
    if not raw:
        print('120: no rows or table missing')
        return
    rows = [line.split('\t') for line in raw.splitlines() if line.strip()]
    print('120 modules:', len(rows))
    for r in rows:
        print(' ', r[1], r[2], 'active=', r[6] if len(r) > 6 else '?')

    raw814, db814, _ = mysql_query(HOST_8140[0], HOST_8140[1], sql_list)
    print('8140 db:', db814, 'count', len(raw814.splitlines()) if raw814 else 0)

    # Ensure table on 8140 and upsert
    create_sql = """
CREATE TABLE IF NOT EXISTS service_home_modules (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_key VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(128) NOT NULL DEFAULT '',
  icon_url VARCHAR(512) DEFAULT NULL,
  price_unit VARCHAR(32) DEFAULT '次',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
    for host, pwd, label in [(HOST_8140[0], HOST_8140[1], '8140')]:
        esc_create = create_sql.replace('\n', ' ').replace('"', '\\"')
        ssh_run(host, pwd, f'mysql -uroot -pCommunityPwd123! community_db -e "{esc_create}" 2>/dev/null || mysql -uroot community_db -e "{esc_create}" 2>/dev/null || mysql -uroot community -e "{esc_create}"')

    inserts = []
    for r in rows:
        if len(r) < 7:
            continue
        _id, gk, title, icon, pu, sort_o, active = r[0], r[1], r[2], r[3], r[4], r[5], r[6]
        icon_sql = 'NULL' if icon in ('', 'NULL', None) else "'" + icon.replace("'", "''") + "'"
        title_sql = title.replace("'", "''")
        inserts.append(
            f"INSERT INTO service_home_modules (group_key,title,icon_url,price_unit,sort_order,is_active) "
            f"VALUES ('{gk}','{title_sql}',{icon_sql},'{pu or '次'}',{sort_o or 0},{active or 1}) "
            f"ON DUPLICATE KEY UPDATE title=VALUES(title),icon_url=VALUES(icon_url),"
            f"price_unit=VALUES(price_unit),sort_order=VALUES(sort_order),is_active=VALUES(is_active);"
        )
    batch = ' '.join(inserts)
    out, err = ssh_run(HOST_8140[0], HOST_8140[1],
        f'mysql -uroot -pCommunityPwd123! community_db -e "{batch}" 2>&1 || mysql -uroot community_db -e "{batch}" 2>&1')
    print('8140 upsert:', out or err or 'ok')

    verify = mysql_query(HOST_8140[0], HOST_8140[1], 'SELECT group_key,title FROM service_home_modules ORDER BY sort_order')[0]
    print('8140 after:', verify)

    import urllib.request
    r = urllib.request.urlopen('https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules', timeout=15)
    d = json.loads(r.read())
    keys = [x.get('group_key') for x in d.get('data', [])]
    print('jshsp1 API keys:', keys)


def sync_categories_services():
    """Sync categories + services for non-default group_keys from 120 -> 8140."""
    keys_sql = "SELECT DISTINCT group_key FROM service_home_modules WHERE is_active=1"
    raw, _, _ = mysql_query(HOST_120[0], HOST_120[1], keys_sql)
    keys = [line.strip() for line in raw.splitlines() if line.strip()]
    for gk in keys:
        if gk in ('tidy', 'urgent_fix', 'appliance_clean', 'pioneer_clean', 'mite_remove',
                 'furniture_care', 'baby_home', 'house_repair', 'beauty_home'):
            continue
        cat_sql = (
            f"SELECT id,name,icon_url,sort_order,group_type FROM categories "
            f"WHERE group_type='{gk.replace(chr(39), '')}' ORDER BY id"
        )
        cats, _, _ = mysql_query(HOST_120[0], HOST_120[1], cat_sql)
        if not cats:
            continue
        for line in cats.splitlines():
            if not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) < 5:
                continue
            cid, name, icon, sort_o, gt = parts[0], parts[1], parts[2], parts[3], parts[4]
            icon_sql = 'NULL' if icon in ('', 'NULL') else "'" + icon.replace("'", "''") + "'"
            name_sql = name.replace("'", "''")
            ins = (
                f"INSERT INTO categories (name,icon_url,sort_order,group_type) "
                f"VALUES ('{name_sql}',{icon_sql},{sort_o or 0},'{gt}') "
                f"ON DUPLICATE KEY UPDATE icon_url=VALUES(icon_url),sort_order=VALUES(sort_order);"
            )
            ssh_run(HOST_8140[0], HOST_8140[1], f'mysql -uroot -pCommunityPwd123! community_db -e "{ins}" 2>/dev/null')
            # services under category
            svc_sql = (
                f"SELECT s.id,s.title,s.price,s.category_id,s.is_published FROM services s "
                f"JOIN categories c ON c.id=s.category_id WHERE c.group_type='{gk}'"
            )
            svcs, _, _ = mysql_query(HOST_120[0], HOST_120[1], svc_sql)
            if not svcs:
                continue
            # map old category id -> new id on 8140
            new_cat, _, _ = mysql_query(
                HOST_8140[0], HOST_8140[1],
                f"SELECT id FROM categories WHERE group_type='{gk}' AND name='{name_sql}' LIMIT 1"
            )
            new_cid = (new_cat.splitlines()[0].strip() if new_cat else cid)
            for sline in svcs.splitlines():
                sp = sline.split('\t')
                if len(sp) < 5:
                    continue
                _, title, price, _, pub = sp[0], sp[1], sp[2], sp[3], sp[4]
                t = title.replace("'", "''")
                sin = (
                    f"INSERT INTO services (title,price,category_id,is_published) "
                    f"VALUES ('{t}',{price or 0},{new_cid},{pub or 1});"
                )
                ssh_run(HOST_8140[0], HOST_8140[1], f'mysql -uroot -pCommunityPwd123! community_db -e "{sin}" 2>/dev/null')


if __name__ == '__main__':
    main()
    sync_categories_services()
