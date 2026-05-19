import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('8.140.204.254', username='root', password='edS904062', timeout=30)
sftp = ssh.open_sftp()

def upload_dir(local_dir, remote_dir):
    """Recursively upload a local directory to remote."""
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + '/' + item
        if os.path.isdir(local_path):
            upload_dir(local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)

# Upload service-portal dist
print('Uploading service-portal...')
stdin, stdout, stderr = ssh.exec_command('rm -rf /var/www/service-provider-portal/dist && mkdir -p /var/www/service-provider-portal/dist')
stdout.read()
upload_dir(r'D:\CODE\project\community\service-portal\dist', '/var/www/service-provider-portal/dist')
print('service-portal uploaded')

# Upload market-portal dist
print('Uploading market-portal...')
stdin, stdout, stderr = ssh.exec_command('rm -rf /var/www/market-merchant-portal/dist && mkdir -p /var/www/market-merchant-portal/dist')
stdout.read()
upload_dir(r'D:\CODE\project\community\market-portal\dist', '/var/www/market-merchant-portal/dist')
print('market-portal uploaded')

sftp.close()
ssh.close()
print('All done')
