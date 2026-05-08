#!/usr/bin/env python3
"""在远端执行：修复小区校验逻辑"""
FILE = '/home/cw/a/community-backend/backend/src/controllers/serviceOrderController.js'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    if (pj.community_id != null) {
      if (commId == null || Number(pj.community_id) !== Number(commId)) {
        return fail(res, 400, '服务商不接该小区');
      }
    }"""

new = """    if (pj.community_id != null && commId != null) {
      if (Number(pj.community_id) !== Number(commId)) {
        return fail(res, 400, '服务商不接该小区');
      }
    }"""

if old in content:
    content = content.replace(old, new, 1)
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patched community check')
else:
    print('NOT FOUND, showing commId lines:')
    for i, line in enumerate(content.split('\n')):
        if 'commId' in line or '不接该小区' in line:
            print(f"  {i+1}: {line}")
