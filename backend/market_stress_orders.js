#!/usr/bin/env node
/**
 * 本地集市下单防超卖压测脚本（虚拟支付模式下即可跑）
 *
 * 用法：
 *   TOKEN=xxx node market_stress_orders.js
 *
 * 可选环境变量：
 *   BASE_URL=http://114.55.167.14:3000
 *   SHOP_ID=1
 *   GOODS_ID=1
 *   CONCURRENCY=20         # 并发 worker 数
 *   REQUESTS=200           # 总请求数
 *   QTY=1                  # 每单购买数量（建议 1）
 */

'use strict';

const BASE_URL = process.env.BASE_URL || 'http://114.55.167.14:3000';
const TOKEN = process.env.TOKEN || '';
const SHOP_ID = Number(process.env.SHOP_ID || 1);
const GOODS_ID = Number(process.env.GOODS_ID || 1);
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 20));
const REQUESTS = Math.max(1, Number(process.env.REQUESTS || 200));
const QTY = Math.max(1, Number(process.env.QTY || 1));
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.REQUEST_TIMEOUT_MS || 10000));
const PROGRESS_EVERY = Math.max(1, Number(process.env.PROGRESS_EVERY || 20));
const POST_WAIT_MS = Math.max(0, Number(process.env.POST_WAIT_MS || 3000));
const { Op } = require('sequelize');

if (!TOKEN) {
  console.error('缺少 TOKEN。用法：TOKEN=xxx node market_stress_orders.js');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function httpJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json };
}

async function getGoods() {
  const maxRetry = 3;
  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const { status, json } = await httpJson(`${BASE_URL}/api/v1/market/goods/${GOODS_ID}`, {
        signal: controller.signal
      });
      if (!json || json.code !== 0) {
        return { ok: false, status, json };
      }
      return { ok: true, status, data: json.data };
    } catch (e) {
      const isAbort = (e && (e.name === 'AbortError' || String(e.message || '').includes('aborted')));
      if (isAbort && attempt < maxRetry) {
        // 偶发瞬时卡住时重试，避免压测因为“取初始库存”失败而无法统计
        await sleep(300 * attempt);
        continue;
      }
      return { ok: false, status: isAbort ? 408 : 0, json: { code: 'EXCEPTION', msg: e && e.message ? e.message : 'unknown' } };
    } finally {
      clearTimeout(timer);
    }
  }
}

function randReceiver(i) {
  const n = String(i).padStart(4, '0');
  return {
    receiver_name: `压测用户${n}`,
    receiver_phone: `138${String(10000000 + (i % 89999999)).slice(0, 8)}`,
    receiver_address: `压测地址-${n}`
  };
}

async function createOrder(i) {
  const payload = {
    shop_id: SHOP_ID,
    items: [{ goods_id: GOODS_ID, quantity: QTY }],
    ...randReceiver(i)
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let status, json;
  try {
    ({ status, json } = await httpJson(`${BASE_URL}/api/v1/market/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }));
  } finally {
    clearTimeout(timer);
  }

  return { status, json };
}

async function main() {
  console.log('== 本地集市下单防超卖压测 ==');
  console.log(JSON.stringify({ BASE_URL, SHOP_ID, GOODS_ID, CONCURRENCY, REQUESTS, QTY, REQUEST_TIMEOUT_MS }));

  // DB 对账用：统计“本次时间窗口内落库的扣减数量”
  // 解决客户端超时（abort）导致 okCount 低估的问题。
  let models = null;
  let persistedQty = null;
  try {
    // eslint-disable-next-line import/no-unresolved
    models = require('./src/models');
  } catch {
    models = null;
  }

  const g0r = await getGoods();
  if (!g0r.ok) {
    console.error('无法获取商品信息，请检查 GOODS_ID 或服务是否可访问。');
    console.error('getGoods error:', JSON.stringify({ status: g0r.status, resp: g0r.json }).slice(0, 600));
    process.exit(1);
  }
  const stock0 = Number(g0r.data.stock);
  console.log(`初始库存 stock0=${stock0}`);

  const start = Date.now();

  let okCount = 0;
  let noStockCount = 0;
  let otherFailCount = 0;
  const otherFails = new Map();
  let authFailCount = 0;
  let timeoutCount = 0;
  let sampleOtherError = null;

  let idx = 0;
  let done = 0;
  const progressTimer = setInterval(() => {
    const rate = done ? (done / ((Date.now() - start) / 1000)).toFixed(1) : '0.0';
    console.log(`[progress] done=${done}/${REQUESTS} ok=${okCount} noStock=${noStockCount} authFail=${authFailCount} timeout=${timeoutCount} otherFail=${otherFailCount} rate=${rate}/s`);
  }, 1000).unref?.();

  async function worker(workerId) {
    while (true) {
      const i = idx++;
      if (i >= REQUESTS) return;

      try {
        const r = await createOrder(i);
        const code = r?.json?.code;
        if (code === 0) {
          okCount++;
        } else if (code === 20012) {
          noStockCount++;
        } else if (r.status === 401 || r.status === 403) {
          authFailCount++;
          otherFailCount++;
          const key = `${code ?? 'NA'}|${r.status}`;
          otherFails.set(key, (otherFails.get(key) || 0) + 1);
        } else {
          otherFailCount++;
          const key = `${code ?? 'NA'}|${r.status}`;
          otherFails.set(key, (otherFails.get(key) || 0) + 1);
          if (!sampleOtherError) {
            sampleOtherError = { status: r.status, code, resp: r.json };
          }
        }
        done++;
        if (done % PROGRESS_EVERY === 0) {
          const rate = (done / ((Date.now() - start) / 1000)).toFixed(1);
          console.log(`[progress] done=${done}/${REQUESTS} ok=${okCount} noStock=${noStockCount} authFail=${authFailCount} timeout=${timeoutCount} otherFail=${otherFailCount} rate=${rate}/s`);
        }
      } catch (e) {
        const isAbort = (e && (e.name === 'AbortError' || String(e.message || '').includes('aborted')));
        if (isAbort) {
          timeoutCount++;
        } else {
          otherFailCount++;
          const key = `EXCEPTION|${e && e.message ? e.message : 'unknown'}`;
          otherFails.set(key, (otherFails.get(key) || 0) + 1);
          if (!sampleOtherError) {
            sampleOtherError = { status: 0, code: 'EXCEPTION', resp: { msg: e && e.message ? e.message : 'unknown' } };
          }
        }
        done++;
        // 避免异常风暴打爆服务
        await sleep(50);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, w) => worker(w)));
  clearInterval(progressTimer);

  // 给服务端一点时间把“客户端已 abort 但服务端事务仍在跑”的请求提交完成
  if (POST_WAIT_MS > 0) await sleep(POST_WAIT_MS);

  const elapsedMs = Date.now() - start;
  const g1r = await getGoods();
  const stock1 = g1r.ok ? Number(g1r.data.stock) : NaN;

  const expectedDec = okCount * QTY;
  const actualDec = Number.isFinite(stock1) ? (stock0 - stock1) : NaN;

  // 统计落库扣减数量（用于最终一致性判断）
  if (models && models.sequelize && models.MarketOrderItem && Number.isFinite(stock0)) {
    try {
      const itemAgg = await models.MarketOrderItem.findAll({
        where: {
          goods_id: GOODS_ID,
          created_at: {
            [Op.between]: [new Date(start - 2000), new Date(Date.now() + 2000)]
          }
        },
        attributes: [[models.sequelize.fn('SUM', models.sequelize.col('quantity')), 'sum_qty']],
        raw: true
      });
      const row = itemAgg && itemAgg[0] ? itemAgg[0] : null;
      persistedQty = row ? Number(row.sum_qty || 0) : 0;
    } catch (e) {
      persistedQty = null;
      console.log('[WARN] DB 落库扣减统计失败：', e && e.message ? e.message : e);
    }
  }

  console.log('\n== 结果汇总 ==');
  console.log(`总请求数     : ${REQUESTS}`);
  console.log(`并发数       : ${CONCURRENCY}`);
  console.log(`成功下单数   : ${okCount}`);
  console.log(`库存不足数   : ${noStockCount}`);
  console.log(`鉴权失败数   : ${authFailCount}`);
  console.log(`请求超时数   : ${timeoutCount}`);
  console.log(`其它失败数   : ${otherFailCount}`);
  console.log(`耗时(ms)     : ${elapsedMs}`);
  console.log(`QTY/单       : ${QTY}`);
  if (persistedQty !== null) console.log(`落库扣减数量 : ${persistedQty}`);
  console.log(`库存变化     : stock0=${stock0} -> stock1=${stock1}`);
  console.log(`期望扣减     : ${expectedDec}`);
  console.log(`实际扣减     : ${actualDec}`);

  if (!Number.isFinite(stock1)) {
    console.log('\n[WARN] 无法获取最终库存，跳过一致性校验。');
    console.log('getGoods(final) error:', JSON.stringify({ status: g1r.status, resp: g1r.json }).slice(0, 600));
    if (sampleOtherError) {
      console.log('sample error:', JSON.stringify(sampleOtherError).slice(0, 800));
    }
    process.exit(2);
  }

  const ok1 = stock1 >= 0;
  const ok2 = persistedQty !== null ? actualDec === persistedQty : true;
  const ok3 = Number.isFinite(actualDec) ? actualDec >= 0 && actualDec <= stock0 : true;

  console.log('\n== 一致性校验 ==');
  console.log(`库存非负(stock1>=0)           : ${ok1 ? 'PASS' : 'FAIL'}`);
  if (persistedQty !== null) {
    console.log(`库存差值==落库扣减数量         : ${ok2 ? 'PASS' : 'FAIL'}`);
  } else {
    console.log(`库存差值==落库扣减数量         : SKIP`);
  }
  console.log(`扣减数量不超过初始库存        : ${ok3 ? 'PASS' : 'FAIL'}`);

  if (otherFails.size) {
    console.log('\n== 其它失败分布(code|httpStatus) ==');
    for (const [k, v] of [...otherFails.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`${k} => ${v}`);
    }
  }

  if (authFailCount > 0 && okCount === 0) {
    console.log('\n[FAIL] 全部请求都鉴权失败（401/403）。你传的 TOKEN 不是登录后 JWT。');
    console.log('正确做法：用登录接口拿到 token（形如 "eyJhbGciOi..."），再 TOKEN=那个值 运行。');
    process.exit(4);
  }

  if (timeoutCount > 0 && okCount === 0) {
    console.log('\n[FAIL] 大量请求超时，压测未完成有效打点。建议降低并发或检查服务是否正常。');
    // 不直接失败：客户端超时不代表服务端未完成提交，
    // 仍以“库存一致性校验”结论为准。
  }

  if (!ok1 || !ok2 || !ok3) {
    console.log('\n[FAIL] 发现可能的并发一致性/超卖问题，请把本次输出发我，我会进一步定位。');
    process.exit(3);
  }

  console.log('\n[OK] 防超卖校验通过。');
}

main().catch(e => {
  console.error('压测脚本异常:', e);
  process.exit(1);
});

