#!/usr/bin/env python3
import json
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE = "https://192.168.110.50:3001/api/v1"
S = requests.Session()
S.verify = False
S.timeout = 12

def call(method, path, token=None, **kwargs):
    url = f"{BASE}{path}"
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = S.request(method, url, headers=headers, **kwargs)
    txt = r.text[:400]
    try:
        data = r.json()
    except Exception:
        data = {"_raw": txt}
    return r.status_code, data, txt

def unwrap(d):
    if isinstance(d, dict):
        if "data" in d and isinstance(d["data"], (dict, list)):
            return d["data"]
        return d
    return d

def pick_list(d):
    u = unwrap(d)
    if isinstance(u, list):
        return u
    if isinstance(u, dict):
        for k in ("list", "rows", "items"):
            if isinstance(u.get(k), list):
                return u[k]
    return []

def get_token():
    # 先尝试测试账号
    for payload in [
        {"phone": "13800000000", "password": "123456"},
        {"phone": "13800138000", "password": "123456"},
    ]:
        code, data, _ = call("POST", "/auth/login_password", json=payload)
        t = (data.get("token") if isinstance(data, dict) else None) or (data.get("data", {}) if isinstance(data, dict) else {}).get("token")
        if t:
            return t, payload["phone"]
    return None, None

def main():
    report = []
    token, phone = get_token()
    if token:
        report.append(f"登录: OK ({phone})")
    else:
        report.append("登录: FAIL（无法获取 token，后续尝试无 token 调用）")

    # 1) 店铺列表
    code, d, raw = call("GET", "/market/shops", token=token, params={"page": 1, "limit": 10})
    shops = pick_list(d)
    report.append(f"店铺列表 /market/shops: HTTP {code}, count={len(shops)}")
    if not shops:
        print("\n".join(report))
        return
    shop = shops[0]
    shop_id = shop.get("id")

    # 2) 店铺商品
    code, d, raw = call("GET", f"/market/shops/{shop_id}/goods", token=token, params={"page": 1, "limit": 20})
    goods = pick_list(d)
    report.append(f"店铺商品 /market/shops/{shop_id}/goods: HTTP {code}, count={len(goods)}")
    if not goods:
        print("\n".join(report))
        return
    good = goods[0]
    goods_id = good.get("id")

    items = [{"goods_id": goods_id, "quantity": 1}]
    payload = {
        "shop_id": shop_id,
        "delivery_mode": "express",
        "receiver_name": "测试用户",
        "receiver_phone": "13800000000",
        "receiver_address": "上海市闵行区合川路地铁站测试地址",
        "remark": "E2E验证",
        "items": items
    }

    # 3) 预结算
    code, d, raw = call("POST", "/market/orders/preview", token=token, json=payload)
    report.append(f"预结算 /market/orders/preview: HTTP {code}, ok={code==200}")

    # 4) 创建订单
    code, d, raw = call("POST", "/market/orders", token=token, json=payload)
    order_no = None
    if isinstance(d, dict):
        data = unwrap(d)
        if isinstance(data, dict):
            order_no = data.get("order_no") or data.get("orderNo")
    report.append(f"创建订单 /market/orders: HTTP {code}, order_no={order_no}")
    if not order_no:
        print("\n".join(report))
        return

    # 5) 模拟支付
    code, d, raw = call("POST", "/market/payments/mock-success", token=token, json={"order_no": order_no})
    report.append(f"模拟支付 /market/payments/mock-success: HTTP {code}")

    # 6) 商家订单列表（同 token 冒烟）
    code, d, raw = call("GET", "/market/merchant/orders", token=token, params={"page": 1, "limit": 20})
    mlist = pick_list(d)
    report.append(f"商家订单列表 /market/merchant/orders: HTTP {code}, count={len(mlist)}")

    # 7) 商家动作（若接口可用）
    code_a, d_a, _ = call("POST", f"/market/merchant/orders/{order_no}/action", token=token, json={"action": "accept"})
    report.append(f"商家接单 action=accept: HTTP {code_a}")
    code_b, d_b, _ = call("POST", f"/market/merchant/orders/{order_no}/action", token=token, json={"action": "dispatch"})
    report.append(f"商家配送 action=dispatch: HTTP {code_b}")

    # 8) 用户确认收货
    code, d, raw = call("POST", f"/market/orders/{order_no}/confirm-receipt", token=token, json={})
    report.append(f"确认收货 /market/orders/{order_no}/confirm-receipt: HTTP {code}")

    # 9) 会话确保（商家联系买家场景）
    code, d, raw = call("POST", "/messages/order-conversation/ensure", token=token, json={
        "order_no": order_no,
        "shop_id": shop_id,
        "channel": "shop_buyer"
    })
    cid = None
    if isinstance(d, dict):
        data = unwrap(d)
        if isinstance(data, dict):
            cid = data.get("conversation_id")
    report.append(f"会话确保 /messages/order-conversation/ensure: HTTP {code}, conversation_id={cid}")

    print("\n".join(report))

if __name__ == "__main__":
    main()
