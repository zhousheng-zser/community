import paramiko, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
sftp = c.open_sftp()
for f in ['src/models/post.js', 'src/models/Post.js', 'src/models/comment.js', 'src/models/like.js']:
    try:
        local = os.path.join('backend', f.replace('/', os.sep))
        os.makedirs(os.path.dirname(local), exist_ok=True)
        sftp.get(f'/root/community-backend/backend/{f}', local)
        print('ok', f)
    except Exception as e:
        print('skip', f, e)
sftp.close()
c.close()
