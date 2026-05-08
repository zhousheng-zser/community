import subprocess
def sql(q):
    r = subprocess.run(['mysql','-uroot','-pCommunityPwd123!','community_db','-e',q], capture_output=True, text=True)
    return r.stdout

print("=== SHOW TABLES ===")
print(sql('SHOW TABLES'))

print("=== service_provider_applications ===")
print(sql('SELECT id,user_id,shop_name,community_id,status FROM service_provider_applications LIMIT 5'))

print("=== service-provider-shop 相关：profile_id=10 的服务 ===")
print(sql('SELECT id,provider_id,title,price,cover_image,is_published FROM Services WHERE provider_id=10 LIMIT 5'))

print("=== getServiceProviderCatalog 关联关系：profile_id vs provider_id ===")
print(sql('SELECT p.id as profile_id, p.user_id, p.shop_name, s.id as svc_id, s.title FROM service_provider_profiles p LEFT JOIN Services s ON s.provider_id=p.id WHERE p.id<=5 LIMIT 20'))
