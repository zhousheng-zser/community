"""Add DEBUG_SKIP_SP_PORTAL_TOKEN=1 to .env"""
import os

envpath = '/home/cw/a/community-backend/backend/.env'
with open(envpath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'DEBUG_SKIP_SP_PORTAL_TOKEN' in content:
    print('Already set, skipping')
else:
    content = content.rstrip() + '\nDEBUG_SKIP_SP_PORTAL_TOKEN=1\n'
    with open(envpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: added DEBUG_SKIP_SP_PORTAL_TOKEN=1')
