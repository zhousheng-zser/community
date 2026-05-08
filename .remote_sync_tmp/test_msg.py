import urllib.request
import urllib.error
import json
import ssl

ctx = ssl._create_unverified_context()
base = 'https://localhost:3001/api/v1'

# Login with password (test account)
req = urllib.request.Request(
    f'{base}/auth/login_password',
    data=json.dumps({'phone': '13800001111', 'password': 'Test@1234'}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        d = json.loads(r.read())
    if d.get('code') == 0:
        token = d['data']['token']
        print('Login OK user_id:', d['data'].get('user', {}).get('id'), 'token:', token[:30], '...')
    else:
        print('Login failed:', d)
        exit(1)
except Exception as e:
    print('Login error:', e)
    exit(1)

# Get conversations
req2 = urllib.request.Request(
    f'{base}/messages/conversations',
    headers={'Authorization': f'Bearer {token}'}
)
try:
    with urllib.request.urlopen(req2, context=ctx) as r:
        d2 = json.loads(r.read())
    convs = d2.get('data', [])
    print(f'Conversations count: {len(convs)}')
    for c in convs:
        bt = c.get('bot_type', '')
        pid = c.get('peer_id', '')
        uc = c.get('unread_count', 0)
        conv = c.get('conversation', {}) or {}
        preview = conv.get('last_message_preview', '') if conv else ''
        peer = c.get('peerUser', {}) or {}
        print(f'  bot_type={bt} peer_id={pid} unread={uc} peer_nick={peer.get("nickname","")} preview={str(preview)[:40]}')
except Exception as e:
    print('Get conversations error:', e)
