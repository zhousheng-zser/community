import paramiko

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('8.140.204.254', username='root', password='edS904062', timeout=30)

def run(cmd):
    stdin, stdout, stderr = s.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', 'ignore')
    err = stderr.read().decode('utf-8', 'ignore')
    print('>>> ' + cmd[:100])
    print(out + err)
    return out + err

sql_script = """
DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER //
CREATE PROCEDURE add_col_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN col_def VARCHAR(256))
BEGIN
  SET @exists_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='community_db' AND TABLE_NAME=tbl AND COLUMN_NAME=col);
  IF @exists_count = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL add_col_if_missing('Users','points','INT NOT NULL DEFAULT 0');
CALL add_col_if_missing('Users','invite_code','VARCHAR(32) DEFAULT NULL');
CALL add_col_if_missing('Users','invited_by','BIGINT DEFAULT NULL');
CALL add_col_if_missing('market_orders','points_earned','INT NOT NULL DEFAULT 0');
CALL add_col_if_missing('service_orders','points_earned','INT NOT NULL DEFAULT 0');
CALL add_col_if_missing('neighbor_assist_orders','points_earned','INT NOT NULL DEFAULT 0');
DROP PROCEDURE IF EXISTS add_col_if_missing;
"""

# Write SQL to remote file
sftp = s.open_sftp()
with sftp.file('/tmp/add_cols.sql', 'w') as f:
    f.write(sql_script)
sftp.close()

run("mysql -uroot -p'CommunityPwd123!' community_db < /tmp/add_cols.sql 2>&1")
run("mysql -uroot -p'CommunityPwd123!' community_db -e 'SHOW COLUMNS FROM Users WHERE Field IN (\"points\",\"invite_code\",\"invited_by\");' 2>&1")

s.close()
print("Done")
