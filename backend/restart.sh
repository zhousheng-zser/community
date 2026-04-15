#!/bin/bash
# 社区后端重启脚本：先停掉占端口的进程，再启动服务

cd "$(dirname "$0")"

# 从 .env 读取 PORT，默认 3000
PORT=${PORT:-3000}
if [ -f .env ]; then
  export $(grep -E '^PORT=' .env | xargs)
  PORT=${PORT:-3000}
fi

echo ">>> 停止占用 ${PORT} 端口的进程..."
PID=$(lsof -ti :${PORT} 2>/dev/null)
if [ -n "$PID" ]; then
  kill $PID 2>/dev/null
  sleep 1
  # 若仍在运行则强制结束
  lsof -ti :${PORT} 2>/dev/null | xargs -r kill -9 2>/dev/null
  echo "    已停止 PID: $PID"
else
  echo "    端口 ${PORT} 未被占用"
fi

LOG_FILE="${LOG_FILE:-logs/server.log}"
mkdir -p "$(dirname "$LOG_FILE")"

echo ">>> 启动后端服务 (PORT=${PORT})，后台运行..."
echo "    日志: $(pwd)/${LOG_FILE}"
nohup node src/index.js >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "    PID: ${SERVER_PID}"

# 等待进程绑定端口（最多约 10 秒）
for _ in $(seq 1 20); do
  if lsof -ti :"${PORT}" >/dev/null 2>&1; then
    echo ">>> 已启动，监听 ${PORT}，可关闭本终端"
    exit 0
  fi
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo ">>> 进程已退出，启动失败，请查看: ${LOG_FILE}"
    exit 1
  fi
  sleep 0.5
done

echo ">>> 超时未检测到端口 ${PORT}，请查看: ${LOG_FILE}"
exit 1
