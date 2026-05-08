import re

filepath = '/home/cw/a/community-backend/backend/src/controllers/messageController.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = """                {
                    model: User,
                    as: 'peerUser',
                    attributes: ['id', 'nickname', 'avatar_url'] // 只返回对方基本信息
                }"""

new = """                {
                    model: User,
                    as: 'peerUser',
                    attributes: ['id', 'nickname', 'avatar_url'],
                    required: false
                }"""

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK patched')
else:
    print('Pattern not found, trying alternate...')
    # Try to find the include block and add required:false
    content2 = re.sub(
        r"(as: 'peerUser',\s*\n\s*attributes: \['id', 'nickname', 'avatar_url'\])\s*// 只返回对方基本信息",
        r"\1,\n                    required: false",
        content
    )
    if content2 != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content2)
        print('OK patched via regex')
    else:
        print('Could not patch')
