import subprocess
def sql(q):
    r = subprocess.run(['mysql','-uroot','-pCommunityPwd123!','community_db','-e',q], capture_output=True, text=True)
    return r.stdout

print("=== 小区列表 ===")
print(sql('SELECT id,name,address FROM communities LIMIT 15'))

print("=== 含合川的小区 ===")
print(sql('SELECT id,name,address FROM communities WHERE name LIKE "%合川%" OR address LIKE "%合川%" LIMIT 5'))

print("=== service_provider_profiles community_id 分布 ===")
print(sql('SELECT community_id, COUNT(*) as cnt FROM service_provider_profiles GROUP BY community_id'))

print("=== 现有 service_provider_profiles ===")
print(sql('SELECT id,user_id,shop_name,contact_name,phone,community_id,status FROM service_provider_profiles ORDER BY id LIMIT 10'))

print("=== 已绑定用户 Users ===")
print(sql('SELECT id,nickname,phone FROM Users WHERE id IN (SELECT user_id FROM service_provider_profiles) ORDER BY id LIMIT 10'))

print("=== Services 现有真实数据 ===")
print(sql('SELECT id,provider_id,title,price,is_published FROM Services WHERE is_published=1 LIMIT 10'))
