import subprocess, json

r = subprocess.run(
    ['curl', '-sk', 'https://localhost:3001/api/v1/core/service-providers?community_id=1&limit=6'],
    capture_output=True, text=True
)
d = json.loads(r.stdout)
providers = d.get('data', [])
print(f"共 {len(providers)} 家服务商")
for p in providers:
    cid = p.get('cover_image') or p.get('shop_front_url') or p.get('avatar_url') or ''
    print(f"  id={p['id']}  name={p.get('name')}  cover={cid[:60]}")

# 检查一家门店的目录
if providers:
    pid = providers[0]['id']
    r2 = subprocess.run(
        ['curl', '-sk', f'https://localhost:3001/api/v1/core/service-providers/{pid}/catalog'],
        capture_output=True, text=True
    )
    d2 = json.loads(r2.stdout)
    groups = d2.get('data', {}).get('groups', [])
    print(f"\n  门店 user_id={pid} 的服务分组数: {len(groups)}")
    for g in groups:
        items = g.get('items', [])
        print(f"    组={g.get('group_label')}  服务数={len(items)}")
        for it in items[:2]:
            print(f"      - {it.get('title')}  ¥{it.get('price')}  cover={str(it.get('cover_image',''))[:50]}")
