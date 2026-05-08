#!/usr/bin/env python3
"""Sync service provider workbench UI changes to 110.50 remote."""
import subprocess, os

HOST = 'cw@192.168.110.50'
LOCAL_BASE = r'D:\CODE\project\community'
REMOTE_BASE = '/home/cw/a/community-backend/miniprogram'

def scp(local, remote):
    r = subprocess.run(['scp', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', local, f'{HOST}:{remote}'],
                       capture_output=True, text=True)
    status = 'OK' if r.returncode == 0 else f'FAIL: {r.stderr[:100]}'
    print(f'  scp {os.path.basename(local)} → {status}')

def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', HOST, cmd],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.stdout.strip(): print('  OUT:', r.stdout.strip()[:300])
    return r.stdout

files = [
    # sp-home
    (r'package-service-provider\pages\sp-home\sp-home.js', 'package-service-provider/pages/sp-home/sp-home.js'),
    (r'package-service-provider\pages\sp-home\sp-home.wxml', 'package-service-provider/pages/sp-home/sp-home.wxml'),
    (r'package-service-provider\pages\sp-home\sp-home.wxss', 'package-service-provider/pages/sp-home/sp-home.wxss'),
    # sp-services
    (r'package-service-provider\pages\sp-services\sp-services.js', 'package-service-provider/pages/sp-services/sp-services.js'),
    (r'package-service-provider\pages\sp-services\sp-services.wxml', 'package-service-provider/pages/sp-services/sp-services.wxml'),
    (r'package-service-provider\pages\sp-services\sp-services.wxss', 'package-service-provider/pages/sp-services/sp-services.wxss'),
    # sp-mine icon fix
    (r'package-service-provider\pages\sp-mine\sp-mine.wxml', 'package-service-provider/pages/sp-mine/sp-mine.wxml'),
    # sp-dispatch icon fix
    (r'package-service-provider\pages\sp-dispatch\sp-dispatch.wxml', 'package-service-provider/pages/sp-dispatch/sp-dispatch.wxml'),
]

print('=== Check remote miniprogram path ===')
ssh(f'ls {REMOTE_BASE}/package-service-provider/pages/ 2>/dev/null || echo "path not found"')

print('=== Syncing files ===')
for local_rel, remote_rel in files:
    local_path = os.path.join(LOCAL_BASE, local_rel)
    remote_path = f'{REMOTE_BASE}/{remote_rel}'
    scp(local_path, remote_path)

# Copy portal.wxss
print('=== Copy portal.wxss to remote ===')
ssh(f'mkdir -p {REMOTE_BASE}/package-service-provider/styles')
scp(os.path.join(LOCAL_BASE, r'package-service-provider\styles\portal.wxss'),
    f'{REMOTE_BASE}/package-service-provider/styles/portal.wxss')

print('=== Done ===')
