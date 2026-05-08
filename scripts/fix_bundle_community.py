#!/usr/bin/env python3
"""修复 createBundle 小区校验逻辑：用户无小区时允许下单，不强制拒绝"""
import subprocess, sys

HOST = 'cw@192.168.110.50'
FILE = '/home/cw/a/community-backend/backend/src/controllers/serviceOrderController.js'

def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', HOST, cmd],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.stdout: print(r.stdout[:400])
    if r.stderr: print('ERR:', r.stderr[:200])
    return r.returncode, r.stdout

# Read file
rc, content = ssh(f"cat {FILE}")
if rc != 0:
    print("读取文件失败"); sys.exit(1)

# Original check: if commId is null AND provider has community_id → reject
# New logic: only reject if BOTH sides have a community_id AND they don't match
old_check = '''    if (pj.community_id != null) {
      if (commId == null || Number(pj.community_id) !== Number(commId)) {
        return fail(res, 400, '服务商不接该小区');
      }
    }'''

new_check = '''    if (pj.community_id != null && commId != null) {
      if (Number(pj.community_id) !== Number(commId)) {
        return fail(res, 400, '服务商不接该小区');
      }
    }'''

if old_check not in content:
    print("未找到目标片段，打印当前社区校验部分：")
    # find any line with community_id
    for i, line in enumerate(content.split('\n')):
        if 'commId' in line or '不接该小区' in line:
            print(f"{i+1}: {line}")
    sys.exit(1)

new_content = content.replace(old_check, new_check, 1)
print("替换成功，写入文件...")

# Write to temp and upload
import tempfile, os
tmp_path = os.path.join(tempfile.gettempdir(), 'serviceOrderController_patch.js')
with open(tmp_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

r = subprocess.run(['scp', '-o', 'BatchMode=yes',
                    tmp_path,
                    f'{HOST}:{FILE}'],
                   capture_output=True, text=True)
print("SCP:", r.returncode, r.stderr[:200] if r.stderr else 'OK')

# Restart backend
print("\n重启后端...")
ssh("pkill -f 'node src/index' 2>/dev/null; sleep 1")
restart_cmd = "cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 &"
ssh(restart_cmd)
import time; time.sleep(3)
rc, log = ssh("tail -5 /tmp/backend.log")
print("Backend log:", log[:300])
