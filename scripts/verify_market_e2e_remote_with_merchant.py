#!/usr/bin/env python3
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE = "https://localhost:3001/api/v1"
S = requests.Session()
S.verify = False
S.timeout = 12

def call(method, path, token=None, json=None, params=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = S.request(method, BASE + path, headers=headers, json=json, params=params)
    try:
        d = r.json()
    except Exception:
        d = {"raw": r.text[:300]}
    return r.status_code, d

def pick_list(d):
    if not isinstance(d, dict):
        return []
    data = d.get("data")
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for k in ("list", "rows", "items"):
            if isinstance(data.get(k), list):
                return data[k]
    return []

def main():
    c, d = call("POST", "/merchant-portal/login", json={})
    merchant_token = ((d.get("data") or {}).get("token")) if isinstance(d, dict) else None
    merchant_shop = ((d.get("data") or {}).get("shop")) if isinstance(d, dict) else {}
    sid = merchant_shop.get("id")
    print("merchant_login", c, bool(merchant_token), "shop_id", sid)
    if not merchant_token or not sid:
        print(d)
        return

    c, d = call("GET", f"/market/shops/{sid}/goods", params={"page": 1, "limit": 20})
    goods = pick_list(d)
    if not goods:
        print("goods fail", c, d)
        return
    gid = goods[0].get("id")
    print("goods", c, "goods_id", gid)

    payload = {
        "shop_id": sid,
        "delivery_mode": "express",
        "receiver_name": "测试用户",
        "receiver_phone": "13800000000",
        "receiver_address": "合川路测试地址",
        "items": [{"goods_id": gid, "quantity": 1}],
    }

    c, d = call("POST", "/market/orders/preview", json=payload)
    print("preview", c)
    c, d = call("POST", "/market/orders", json=payload)
    data = d.get("data") if isinstance(d, dict) else {}
    order_no = (data or {}).get("order_no") or (data or {}).get("orderNo")
    print("create", c, order_no)
    if not order_no:
        print(d)
        return

    c, d = call("POST", "/market/payments/create", json={"order_no": order_no, "pay_type": "wechat"})
    print("create_payment", c, (d.get("msg") if isinstance(d, dict) else ""))
    c, d = call("POST", "/market/payments/mock-success", json={"order_no": order_no})
    print("mockpay", c, (d.get("msg") if isinstance(d, dict) else ""))

    c, d = call("GET", "/market/merchant/orders", token=merchant_token, params={"page": 1, "limit": 20})
    print("merchant_orders", c)

    c, d = call("POST", f"/market/merchant/orders/{order_no}/action", token=merchant_token, json={"action": "accept"})
    print("accept", c, d.get("msg") if isinstance(d, dict) else d)
    c, d = call("POST", f"/market/merchant/orders/{order_no}/action", token=merchant_token, json={"action": "dispatch"})
    print("dispatch", c, d.get("msg") if isinstance(d, dict) else d)

    c, d = call("POST", f"/market/orders/{order_no}/confirm-receipt", json={})
    print("confirm_receipt", c)

    c, d = call("POST", "/messages/order-conversation/ensure", json={
        "order_no": order_no,
        "shop_id": sid,
        "channel": "shop_buyer"
    })
    cid = ((d.get("data") or {}).get("conversation_id")) if isinstance(d, dict) else None
    print("ensure_conversation", c, cid)

if __name__ == "__main__":
    main()
