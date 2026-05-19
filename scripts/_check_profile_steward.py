import paramiko, json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('120.27.239.244', 22, 'root', 'cW123456', timeout=20, look_for_keys=False, allow_agent=False)
cmd = r'''TOKEN=$(curl -s -X POST http://127.0.0.1:3002/api/v1/auth/login_sms -H "Content-Type: application/json" -d '{"phone":"15267619061","code":"024680"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s http://127.0.0.1:3002/api/v1/user/profile -H "Authorization: Bearer $TOKEN"'''
_, o, _ = c.exec_command(cmd, timeout=15)
data = json.loads(o.read().decode('utf-8'))
print(json.dumps(data, ensure_ascii=False, indent=2)[:2000])
c.close()
