"""
小区管家入驻 前后端完整链路测试（120.27.239.244）
流程：用户登录 → 提交申请 → 查申请 → 中台列表 → 通过 → 档案 → 驳回重提
"""
import json
import sys
import time
import urllib.request
import urllib.error
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = 'http://127.0.0.1:3002/api/v1'
HOST = '120.27.239.244'
TEST_PHONE = '15267619061'
SMS_CODE = '024680'

passed = 0
failed = 0
results = []


def record(name, ok, detail=''):
    global passed, failed
    if ok:
        passed += 1
        mark = 'PASS'
    else:
        failed += 1
        mark = 'FAIL'
    line = f'[{mark}] {name}' + (f' — {detail}' if detail else '')
    results.append(line)
    print(line)


def ssh_run(cmd, t=20):
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
    _, o, e = c.exec_command(cmd, timeout=t)
    out = o.read().decode('utf-8', 'replace').strip()
    err = e.read().decode('utf-8', 'replace').strip()
    c.close()
    return out, err


def api(method, path, body=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode('utf-8', 'replace')
            try:
                return r.status, json.loads(raw)
            except json.JSONDecodeError:
                return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', 'replace')
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def curl_via_ssh(method, path, body=None, token=None):
    """在 120 本机 curl，避免外网不通"""
    parts = [f'curl -s -w "\\n%{{http_code}}" -X {method} "{BASE}{path}"', '-H "Content-Type: application/json"']
    if token:
        parts.append(f'-H "Authorization: Bearer {token}"')
    if body is not None:
        b = json.dumps(body, ensure_ascii=False).replace('"', '\\"')
        parts.append(f'-d "{b}"')
    cmd = ' '.join(parts)
    out, err = ssh_run(cmd)
    lines = out.strip().split('\n')
    if not lines:
        return 0, {'error': err or 'empty'}
    code_line = lines[-1].strip()
    try:
        status = int(code_line)
    except ValueError:
        status = 0
    body_text = '\n'.join(lines[:-1]).strip()
    try:
        return status, json.loads(body_text) if body_text else {}
    except json.JSONDecodeError:
        return status, body_text


def get_token_login_sms():
    status, res = curl_via_ssh('POST', '/auth/login_sms', {'phone': TEST_PHONE, 'code': SMS_CODE})
    if status != 200 or not isinstance(res, dict):
        return None, f'login_sms HTTP {status} {res}'
    token = res.get('token') or (res.get('data') or {}).get('token')
    if not token:
        return None, f'no token in {res}'
    return token, 'ok'


def get_admin_token():
    status, res = curl_via_ssh('POST', '/auth/admin/login', {'username': 'admin'})
    if status != 200:
        return None, res
    token = (res.get('data') or {}).get('token') or res.get('token')
    return token, 'ok'


def main():
    print('=' * 60)
    print('小区管家入驻 完整功能测试 @ 120')
    print('=' * 60)

    # 0. 路由可达
    st, _ = curl_via_ssh('GET', '/steward/applications')
    record('路由 /steward/applications 已挂载', st in (401, 403), f'HTTP {st}')

    # 1. 用户登录
    user_token, msg = get_token_login_sms()
    record('用户 SMS 登录', user_token is not None, msg if not user_token else 'token ok')
    if not user_token:
        print_summary()
        return 1

    # 清理旧申请便于完整重测
    ssh_run(
        'MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -e '
        f'"DELETE p FROM community_steward_profiles p INNER JOIN users u ON p.user_id=u.id WHERE u.phone=\'{TEST_PHONE}\'; '
        f'DELETE a FROM community_steward_applications a INNER JOIN users u ON a.user_id=u.id WHERE u.phone=\'{TEST_PHONE}\';" 2>&1'
    )

    # 2. 提交入驻申请（模拟 join-steward.js）
    apply_body = {
        'name': '张测试',
        'phone': TEST_PHONE,
        'gender': '男',
        'community_name': '测试社区A',
        'id_card': '110101199001011234',
        'id_card_url': '/uploads/test-idcard.jpg',
        'intro': '自动化测试提交'
    }
    st, res = curl_via_ssh('POST', '/steward/apply', apply_body, user_token)
    ok_apply = st == 200 and isinstance(res, dict) and res.get('code') == 0
    record('POST /steward/apply 提交申请', ok_apply, str(res)[:120])

    # 3. 缺少字段校验
    st2, res2 = curl_via_ssh('POST', '/steward/apply', {'name': 'x'}, user_token)
    record('申请参数校验（缺手机号/社区）', st2 == 400, f'HTTP {st2}')

    # 4. 查询我的申请
    st, res = curl_via_ssh('GET', '/steward/application/me', token=user_token)
    ok_me = st == 200 and isinstance(res, dict) and res.get('code') == 0
    app_data = (res.get('data') if isinstance(res, dict) else {}) or {}
    record('GET /steward/application/me', ok_me and app_data.get('status') == 'pending',
           f"status={app_data.get('status')}")

    app_id = app_data.get('id')

    # 5. 未通过时 profile 应拒绝
    st, res = curl_via_ssh('GET', '/steward/profile/me', token=user_token)
    record('待审时 GET /steward/profile/me 返回403', st == 403, f'HTTP {st}')

    # 6. 管理员登录 + 列表
    admin_token, _ = get_admin_token()
    record('中台 admin 登录', admin_token is not None)
    if not admin_token:
        print_summary()
        return 1

    st, res = curl_via_ssh('GET', '/steward/applications?status=pending&page=1&pageSize=20', token=admin_token)
    lst = ((res.get('data') or {}).get('list') if isinstance(res, dict) else []) or []
    found = any(str(x.get('phone')) == TEST_PHONE for x in lst)
    record('中台 GET /steward/applications 待审列表', st == 200 and found,
           f'list_len={len(lst)}')

    if not app_id and lst:
        for x in lst:
            if str(x.get('phone')) == TEST_PHONE:
                app_id = x.get('id')
                break

    # 7. 无权限访问列表
    st, _ = curl_via_ssh('GET', '/steward/applications?status=pending', token=user_token)
    record('普通用户无法访问审核列表', st == 403, f'HTTP {st}')

    # 8. 驳回
    if app_id:
        st, res = curl_via_ssh('POST', f'/steward/applications/{app_id}/review',
                               {'status': 'rejected', 'reject_reason': '测试驳回：资料不完整'}, admin_token)
        record('中台驳回申请', st == 200 and isinstance(res, dict) and res.get('code') == 0, str(res)[:80])

        st, res = curl_via_ssh('GET', '/steward/application/me', token=user_token)
        st_val = (res.get('data') or {}).get('status') if isinstance(res, dict) else None
        reason = (res.get('data') or {}).get('reject_reason') if isinstance(res, dict) else ''
        reason = reason or ''
        record('驳回后用户侧 status=rejected', st_val == 'rejected' and '资料不完整' in reason,
               f'status={st_val} reason={reason[:30]}')

        # 9. 重新申请
        apply_body['intro'] = '补充资料后重新提交'
        st, res = curl_via_ssh('POST', '/steward/apply', apply_body, user_token)
        record('驳回后重新提交申请', st == 200 and (res.get('data') or {}).get('status') == 'pending',
               str(res)[:80])

        # 10. 通过
        st, res = curl_via_ssh('POST', f'/steward/applications/{app_id}/review',
                               {'status': 'approved'}, admin_token)
        record('中台通过申请', st == 200 and isinstance(res, dict) and res.get('code') == 0, str(res)[:80])
    else:
        record('中台驳回/通过（跳过）', False, '未找到申请 ID')

    # 11. 通过后 profile
    st, res = curl_via_ssh('GET', '/steward/profile/me', token=user_token)
    prof = (res.get('data') if isinstance(res, dict) else {}) or {}
    profile = prof.get('profile') or {}
    record('通过后 GET /steward/profile/me', st == 200 and profile.get('community_name') == '测试社区A',
           f"community={profile.get('community_name')}")

    # 12. 已通过不可重复申请为 pending
    st, res = curl_via_ssh('POST', '/steward/apply', apply_body, user_token)
    msg = res.get('msg') if isinstance(res, dict) else str(res)
    record('已通过用户重复申请提示', '已是认证' in (msg or ''), msg[:60])

    # 13. DB 档案表
    db_out, _ = ssh_run(
        'MYSQL_PWD=CommunityPwd123! mysql -uroot community_db -N -e '
        f'"SELECT a.status, IFNULL(p.community_name,\'NULL\') FROM community_steward_applications a '
        f'INNER JOIN users u ON u.id=a.user_id '
        f'LEFT JOIN community_steward_profiles p ON p.user_id=a.user_id '
        f'WHERE u.phone=\'{TEST_PHONE}\' ORDER BY a.id DESC LIMIT 1;" 2>&1'
    )
    record('DB 申请+档案一致', 'approved' in db_out and '测试社区A' in db_out, db_out)

    # 14. 前端页面/路由静态检查（本地仓库）
    import os
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    frontend_files = [
        'pages/join-steward/join-steward.js',
        'pages/join-steward/join-steward.wxml',
        'pages/user/user.js',
        'package-steward/pages/steward-home/steward-home.js',
        'admin/src/views/StewardApplications.vue',
    ]
    missing = [f for f in frontend_files if not os.path.isfile(os.path.join(root, f))]
    record('前端关键页面文件齐全', len(missing) == 0, missing or 'ok')

    # 15. join-steward 调用 steward/apply
    js = open(os.path.join(root, 'pages/join-steward/join-steward.js'), encoding='utf-8').read()
    record('入驻页调用 steward/apply API', "util.post('steward/apply'" in js)

    # 16. user.js 入驻入口
    ujs = open(os.path.join(root, 'pages/user/user.js'), encoding='utf-8').read()
    record('个人中心有管家入驻入口 goStewardJoin', 'goStewardJoin' in ujs and 'join-steward' in ujs)

    # 17. 中台页面 API 路径
    vue = open(os.path.join(root, 'admin/src/views/StewardApplications.vue'), encoding='utf-8').read()
    record('中台页调用 /steward/applications', "'/steward/applications'" in vue or '"/steward/applications"' in vue)

    print_summary()
    return 0 if failed == 0 else 1


def print_summary():
    print('\n' + '=' * 60)
    print(f'合计: {passed} 通过, {failed} 失败')
    print('=' * 60)
    if failed:
        print('失败项:')
        for r in results:
            if r.startswith('[FAIL]'):
                print(' ', r)


if __name__ == '__main__':
    sys.exit(main())
