#!/usr/bin/env python3
"""将 createBundle 的查询从 id 改回 user_id（原始逻辑正确）"""
FILE = '/home/cw/a/community-backend/backend/src/controllers/serviceOrderController.js'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 错误的修复：用 id 查找
old = "where: { id: parseInt(provider_id, 10), status: 'active' }"
# 正确的：用 user_id 查找（前端传的 provider_id 实际是 user_id）
new = "where: { user_id: parseInt(provider_id, 10), status: 'active' }"

if old in content:
    content = content.replace(old, new, 1)
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: reverted to user_id lookup')
else:
    print('NOT FOUND, current provider lookup lines:')
    for i, line in enumerate(content.split('\n')):
        if 'ServiceProviderProfile.findOne' in line or ('where: {' in line and 'provider' in content.split('\n')[max(0,i-3):i+1][0] if i > 0 else False):
            print(f"  {i+1}: {line}")
    # Try to find any findOne near ServiceProviderProfile
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'ServiceProviderProfile.findOne' in line:
            for j in range(i, min(i+5, len(lines))):
                print(f"  {j+1}: {lines[j]}")
            break
