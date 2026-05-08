import subprocess
def sql(q):
    r = subprocess.run(['mysql','-uroot','-pCommunityPwd123!','community_db','-e',q], capture_output=True, text=True)
    return r.stdout.strip()

sql('UPDATE Services SET is_published=0 WHERE provider_id IS NULL')
print('hidden:', sql('SELECT COUNT(*) as hidden FROM Services WHERE provider_id IS NULL AND is_published=0'))
print('visible:', sql('SELECT COUNT(*) as visible FROM Services WHERE is_published=1'))
