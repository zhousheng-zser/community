/**
 * 简易雪花 ID（64 位）：时间戳(41) + 机器(10) + 序列(12)
 * 返回字符串，避免 JSON/JS 大整数精度问题。
 */
const EPOCH = 1704067200000n; // 2024-01-01 UTC
const WORKER_ID = BigInt(parseInt(process.env.SNOWFLAKE_WORKER_ID || '1', 10) & 0x3ff);

let lastTs = -1n;
let sequence = 0n;

function nextSnowflakeId() {
  let ts = BigInt(Date.now()) - EPOCH;
  if (ts === lastTs) {
    sequence = (sequence + 1n) & 0xfffn;
    if (sequence === 0n) {
      while (ts <= lastTs) {
        ts = BigInt(Date.now()) - EPOCH;
      }
    }
  } else {
    sequence = 0n;
  }
  lastTs = ts;
  const id = (ts << 22n) | (WORKER_ID << 12n) | sequence;
  return id.toString();
}

module.exports = { nextSnowflakeId };
