/**
 * 平台抽成预估（发单页展示）
 */
let cachedRates = null;
let cacheAt = 0;
const CACHE_MS = 5 * 60 * 1000;

function calcFeeSync(payable, rate) {
  const p = Number(payable) || 0;
  const r = Math.min(Math.max(Number(rate) || 0, 0), 0.3);
  const fee = Number((p * r).toFixed(2));
  const settlement = Number(Math.max(p - fee, 0).toFixed(2));
  return { platform_fee_amount: fee, settlement_amount: settlement, platform_fee_rate: r };
}

function getRateForType(rates, orderType) {
  if (!rates) return 0.1;
  const key = String(orderType || 'neighbor_assist').toLowerCase();
  const map = {
    market: rates.market,
    service: rates.service,
    neighbor_assist: rates.neighbor_assist
  };
  const specific = map[key];
  if (specific != null && specific !== '' && Number.isFinite(Number(specific))) {
    return Number(specific);
  }
  return Number(rates.global != null ? rates.global : 0.1);
}

function loadRates(util) {
  const now = Date.now();
  if (cachedRates && now - cacheAt < CACHE_MS) {
    return Promise.resolve(cachedRates);
  }
  return util.get('platform/fee-rates', {}, { silent: true })
    .then((res) => {
      const d = (res && res.data) || res || {};
      cachedRates = d;
      cacheAt = now;
      return d;
    })
    .catch(() => ({ global: 0.1 }));
}

function estimateSettlement(util, payable, orderType) {
  const p = Number(payable) || 0;
  if (p <= 0) return Promise.resolve({ settlement_amount: 0, platform_fee_amount: 0 });
  return loadRates(util).then((rates) => {
    const rate = getRateForType(rates, orderType);
    return calcFeeSync(p, rate);
  });
}

module.exports = {
  calcFeeSync,
  estimateSettlement,
  loadRates
};
