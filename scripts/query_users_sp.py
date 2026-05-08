import subprocess
def sql(q):
    r = subprocess.run(['mysql','-uroot','-pCommunityPwd123!','community_db','-e',q], capture_output=True, text=True)
    return r.stdout

print("=== 真实用户（非E2E）===")
print(sql("SELECT id,nickname,phone FROM Users WHERE nickname NOT LIKE '%E2E%' AND nickname NOT LIKE '%test%' ORDER BY id DESC LIMIT 10"))

print("=== 可用的服务商 profile（id 1-10）===")
print(sql("SELECT id,user_id,shop_name,status FROM service_provider_profiles WHERE id<=10 ORDER BY id"))

print("=== 当前最新登录用户（id最大的几个）===")
print(sql("SELECT id,nickname,phone,openid FROM Users ORDER BY id DESC LIMIT 5"))
