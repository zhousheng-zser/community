import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('8.140.204.254', 22, 'root', 'edS904062', timeout=30, look_for_keys=False, allow_agent=False)
cmd = """MYSQL_PWD='CommunityPwd123!' mysql -uroot community_db -e "
SELECT role,COUNT(*) cnt,SUM(available_amount) avail,SUM(withdrawn_amount) wd FROM partner_commission_balances GROUP BY role;
SELECT order_type,COUNT(*) cnt,SUM(settlement_amount) amt FROM order_settlements GROUP BY order_type;
SELECT status,COUNT(*) cnt FROM commission_distributions GROUP BY status;
" """
_, o, e = c.exec_command(cmd, timeout=30)
print((o.read() + e.read()).decode())
c.close()
