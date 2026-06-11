/**
 * 简易雪花 ID（后端用户等 BIGINT 主键）
 * workerId 可通过 SNOWFLAKE_WORKER_ID 配置（0–31）
 */
const WORKER_ID = BigInt(parseInt(process.env.SNOWFLAKE_WORKER_ID, 10) || 1) & 31n;
const EPOCH = 1609459200000n;

let lastTs = -1n;
let sequence = 0n;

function nextSnowflakeId() {
  let ts = BigInt(Date.now());
  if (ts === lastTs) {
    sequence = (sequence + 1n) & 4095n;
    if (sequence === 0n) {
      while (ts <= lastTs) ts = BigInt(Date.now());
    }
  } else {
    sequence = 0n;
  }
  lastTs = ts;
  const id = ((ts - EPOCH) << 22n) | (WORKER_ID << 12n) | sequence;
  return id.toString();
}

module.exports = { nextSnowflakeId };
