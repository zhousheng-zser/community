#!/usr/bin/env python3
import json
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE = "https://localhost:3001/api/v1"
S = requests.Session()
S.verify = False
S.timeout = 12

def call(method, path, token=None, **kwargs):
    url = f"{BASE}{path}"
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = S.request(method, url, headers=headers, **kwargs)
    try:
        data = r.json()
    except Exception:
        data = {"_raw": r.text[:400]}
    return r.status_code, data

def unwrap(d):
    if isinstance(d, dict) and isinstance(d.get("data"), (dict, list)):
        return d["data"]
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
    for payload in [
        {"phone": "13800000000", "password": "123456"},
        {"phone": "13800138000", "password": "123456"},
    ]:
        c, d = call("POST", "/auth/login_password", json=payload)
        if isinstance(d, dict):
            t = d.get("token") or (d.get("data") or {}).get("token")
            if t:
                return t, payload["phone"]
    return None, None

def main():
    out = []
    token, phone = get_token()
    out.append(f"login: {'OK '+phone if token else 'FAIL'}")

    c, d = call("GET", "/market/shops", token=token, params={"page": 1, "limit": 10})
    shops = pick_list(d)
    out.append(f"shops: HTTP {c}, count={len(shops)}")
    if not shops:
        print("\n".join(out)); return
    shop_id = shops[0].get("id")

    c, d = call("GET", f"/market/shops/{shop_id}/goods", token=token, params={"page": 1, "limit": 20})
    goods = pick_list(d)
    out.append(f"goods: HTTP {c}, count={len(goods)}")
    if not goods:
        print("\n".join(out)); return
    goods_id = goods[0].get("id")

    payload = {
        "shop_id": shop_id,
        "delivery_mode": "express",
        "receiver_name": "测试用户",
        "receiver_phone": "13800000000",
        "receiver_address": "合川路地铁站E2E地址",
        "remark": "E2E",
        "items": [{"goods_id": goods_id, "quantity": 1}],
    }

    c, d = call("POST", "/market/orders/preview", token=token, json=payload)
    out.append(f"preview: HTTP {c}")
    c, d = call("POST", "/market/orders", token=token, json=payload)
    data = unwrap(d) if isinstance(d, dict) else {}
    order_no = data.get("order_no") or data.get("orderNo") if isinstance(data, dict) else None
    out.append(f"create: HTTP {c}, order_no={order_no}")
    if not order_no:
        print("\n".join(out)); return

    c, d = call("POST", "/market/payments/mock-success", token=token, json={"order_no": order_no})
    out.append(f"mock pay: HTTP {c}")

    c, d = call("POST", f"/market/merchant/orders/{order_no}/action", token=token, json={"action": "accept"})
    out.append(f"merchant accept: HTTP {c}")
    c, d = call("POST", f"/market/merchant/orders/{order_no}/action", token=token, json={"action": "dispatch"})
    out.append(f"merchant dispatch: HTTP {c}")

    c, d = call("POST", f"/market/orders/{order_no}/confirm-receipt", token=token, json={})
    out.append(f"confirm receipt: HTTP {c}")

    c, d = call("POST", "/messages/order-conversation/ensure", token=token, json={
        "order_no": order_no,
        "shop_id": shop_id,
        "channel": "shop_buyer"
    })
    dd = unwrap(d) if isinstance(d, dict) else {}
    cid = dd.get("conversation_id") if isinstance(dd, dict) else None
    out.append(f"ensure conversation: HTTP {c}, cid={cid}")
    print("\n".join(out))

if __name__ == "__main__":
    main()
