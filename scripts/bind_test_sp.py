import subprocess
def sql(q):
    r = subprocess.run(['mysql','-uroot','-pCommunityPwd123!','community_db','-e',q], capture_output=True, text=True)
    return r.stdout

# 查看当前真实用户中最可能是测试用的
print("=== 真实用户（id 60+）===")
print(sql("SELECT id,nickname,phone,openid FROM Users WHERE id>=60 ORDER BY id"))

# 将 user_id=65 绑定到 profile id=1（晶洁家政服务中心）
# 先查 user 65 是否存在
users_out = sql("SELECT id FROM Users WHERE id=65")
if '65' in users_out:
    # 检查 user_id 65 是否已有 profile
    existing = sql("SELECT id,shop_name FROM service_provider_profiles WHERE user_id=65")
    if 'id' in existing and len(existing.strip().split('\n')) > 1:
        print("user_id=65 已有 profile:")
        print(existing)
    else:
        # 更新 profile id=1 的 user_id 到 65
        # 先把原来 user_id=65 的应用记录清理
        sql("UPDATE service_provider_profiles SET user_id=65 WHERE id=1")
        print("已将 profile id=1 (晶洁家政服务中心) 绑定到 user_id=65")
else:
    print("user_id=65 不存在，检查 user_id=64")
    users64 = sql("SELECT id FROM Users WHERE id=64")
    if '64' in users64:
        sql("UPDATE service_provider_profiles SET user_id=64 WHERE id=1")
        print("已将 profile id=1 绑定到 user_id=64")

# 验证
print("\n=== 验证绑定结果 ===")
print(sql("SELECT p.id,p.user_id,p.shop_name,u.nickname,u.phone FROM service_provider_profiles p JOIN Users u ON u.id=p.user_id WHERE p.id=1"))

# 同时确保 DEBUG 标志已设置
print("\n=== 远端 .env DEBUG 标志 ===")
import os
r = subprocess.run(['cat', '/home/cw/a/community-backend/backend/.env'], capture_output=True, text=True)
lines = [l for l in r.stdout.split('\n') if 'DEBUG' in l or 'SP' in l]
print('\n'.join(lines) if lines else '未找到 DEBUG_SKIP_SP_PORTAL_TOKEN')
