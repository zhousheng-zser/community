import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd, t=30):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

with c.open_sftp() as sftp:
    with sftp.open('/tmp/diag_posts.py', 'w') as f:
        f.write('''import json, urllib.request, urllib.parse, jwt
BASE="http://127.0.0.1:3002/api/v1"

def req(method,path,body=None,token=None):
    h={"Content-Type":"application/json"}
    if token: h["Authorization"]="Bearer "+token
    data=json.dumps(body).encode() if body else None
    r=urllib.request.Request(BASE+path,data=data,headers=h,method=method)
    resp=urllib.request.urlopen(r,timeout=15)
    return resp.status, json.loads(resp.read().decode())

st,b=req("POST","/auth/login_sms",{"phone":"13800000000","code":"024680"})
tok=b.get("token") or (b.get("data") or {}).get("token")
user=b.get("user") or (b.get("data") or {}).get("user") or {}
print("login_id", user.get("id"))
dec=jwt.decode(tok, options={"verify_signature": False})
print("jwt_id", dec.get("id"))
q=urllib.parse.urlencode({"category":"热门话题","page":1,"limit":10})
st2,body=req("GET","/posts?"+q,token=tok)
print("posts_http", st2, "total", body.get("total"), "list_len", len(body.get("list") or []))
if body.get("list"):
    for p in body["list"][:3]:
        print(" post", p.get("id"), p.get("category"), (p.get("content") or "")[:20])
st3,body3=req("GET","/posts?"+urllib.parse.urlencode({"page":1,"limit":10}),token=tok)
print("no_category total", body3.get("total"))
''')

print(run('python3 /tmp/diag_posts.py'))
c.close()
