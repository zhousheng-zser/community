#!/usr/bin/env python3
"""Patch remote admin router and layout to add ServiceProviders page."""
import subprocess

HOST = 'cw@192.168.110.50'

def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('OUT:', r.stdout[:500])
    if r.stderr: print('ERR:', r.stderr[:200])
    return r.stdout

# Check layout content around service provider section
print("=== Check layout service section ===")
ssh("grep -n 'service-provider\\|直约' /home/cw/a/community-backend/admin/src/layout/index.vue")

# Patch router via python script on remote
script_content = '''
path = "/home/cw/a/community-backend/admin/src/router/index.js"
with open(path) as f:
    c = f.read()
new_route = "      { path: \\'service-providers\\', name: \\'ServiceProviders\\', component: () => import(\\'../views/ServiceProviders.vue\\'), meta: { title: \\'直约服务商管理\\' } },"
old_anchor = "{ path: \\'service-provider-applications\\'"
if "service-providers\\'" in c and "ServiceProviders" in c:
    print("route already exists")
else:
    c = c.replace(old_anchor, new_route + "\\n      " + old_anchor)
    with open(path, "w") as f:
        f.write(c)
    print("route added to router")
'''

print("=== Patch router ===")
ssh(f"python3 << 'PYEOF'\n{script_content}\nPYEOF")

# Patch layout
layout_script = '''
path = "/home/cw/a/community-backend/admin/src/layout/index.vue"
with open(path) as f:
    c = f.read()
new_item = "        <el-menu-item index=\\"/service-providers\\">直约服务商管理</el-menu-item>"
old_anchor = '<el-menu-item index="/service-provider-applications">'
if "/service-providers\\">" in c:
    print("menu item already exists")
else:
    c = c.replace(old_anchor, new_item + "\\n        " + old_anchor)
    with open(path, "w") as f:
        f.write(c)
    print("menu item added to layout")
'''

print("=== Patch layout ===")
ssh(f"python3 << 'PYEOF'\n{layout_script}\nPYEOF")

# Rebuild remote admin
print("=== Rebuild remote admin ===")
ssh("cd /home/cw/a/community-backend/admin && npm run build 2>&1 | tail -8")

print("=== Done ===")
