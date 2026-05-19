import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

# gfg/ddsd 的 icon_url 设为 NULL，前端走 emoji 展示
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
          "\"UPDATE service_home_modules SET icon_url=NULL, updatedAt=NOW() WHERE group_key IN ('gfg','ddsd');\""))

print('\n=== 确认 ===')
print(run("MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
          "\"SELECT group_key, title, icon_url, sort_order FROM service_home_modules ORDER BY sort_order;\""))
c.close()
