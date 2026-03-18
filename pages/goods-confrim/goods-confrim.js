// pages/good-confrim/good-confrim.js
const app = getApp();
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponIndex: "0",
    array: [],
    canuseCoupons: [],
    discountMoney: "0.00", // 优惠金额（market 流程也保持为 0.00）
    realPayMoney: "0.00", // 实付款（已经考虑优惠后）
    address: null,
    shopId: null,
    goodsAmount: "0.00",
    deliveryFee: "0.00",
    payableAmount: "0.00"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.from === 'local') {
      const list = wx.getStorageSync('local_checkout_goods') || [];
      const totle = wx.getStorageSync('local_checkout_totle') || "0.00";
      const shopId = wx.getStorageSync('local_checkout_shop_id') || null;
      // 调试/联调临时地址：避免未选择地址导致提交订单被拦截
      const tempAddress = {
        name: '临时收货人',
        tel: '13800001111',
        detail: '杭州市滨江区网商路100号 (临时填充)'
      };
      this.setData({
        list,
        totle,
        address: tempAddress,
        shopId,
        goodsAmount: totle,
        deliveryFee: "0.00",
        payableAmount: totle,
        discountMoney: "0.00",
        realPayMoney: totle
      });
      this.previewOrder(); // 尝试预结算，失败时使用本地金额兜底
      // 一期 market 流程不支持优惠券计算，避免 UI 金额与后端入账不一致
      if (!shopId) {
        this.getCoupons();
      } else {
        this.setData({
          array: [],
          canuseCoupons: [],
          couponIndex: "0",
          discountMoney: "0.00",
          realPayMoney: totle
        });
      }
    } else {
      const { indexs, totle } = options;
      this.getGoods(indexs, totle);
      this.getCoupons();
    }
  },
  async previewOrder() {
    const { shopId, list } = this.data;
    if (!shopId || !Array.isArray(list) || list.length === 0) return;
    try {
      const items = list.map(it => ({
        goods_id: it.goodsId,
        quantity: it.goodsNum
      }));
      const res = await util.post('market/orders/preview', {
        shop_id: shopId,
        items
      });
      const data = res && res.data ? res.data : res;
      if (!data) return;
      const goodsAmount = String(data.goods_amount || this.data.totle || "0.00");
      const deliveryFee = String(data.delivery_fee || "0.00");
      const payableAmount = String(data.payable_amount || goodsAmount);
      this.setData({
        goodsAmount,
        deliveryFee,
        payableAmount,
        totle: payableAmount,
        // market 流程无优惠券输入，实付款=应付金额
        discountMoney: "0.00",
        realPayMoney: payableAmount
      });
    } catch (e) {
      // 预结算失败时继续使用本地 totle，不中断用户流程
    }
  },
  getCoupons() {
    const { id: userId } = app.globalData.user;
    util.get("api/wx/user/coupon/" + userId).then((data) => {
      let array = [],
        canuseCoupons = [];
      const nowTime=new Date().getTime();   
      data.forEach((v, i) => {
        const totle = this.data.totle;
        if (nowTime<=v.endTime){//未过期
          if (v.sendType == 2) {//新人券
            const num = v.couponMoney;
            if (parseFloat(totle) >= parseFloat(num)) {
              array.push(v.couponName);
              canuseCoupons.push(v)
            }
          } else {//满减券
            const num = v.remarkC;
            if (parseFloat(totle) >= parseFloat(num)) {
              //满减判断金额是否符合要求
              array.push(v.couponName);
              canuseCoupons.push(v)
            }
          }
        }
        

      })
      this.setData({
        array,
        canuseCoupons
      })
      // 默认取第一个券计算展示（若券为空则为 0）
      const first = canuseCoupons && canuseCoupons.length > 0 ? canuseCoupons[0] : null;
      const couponMoney = first && first.couponMoney != null ? first.couponMoney : "0";
      const discount = (parseFloat(couponMoney) || 0).toFixed(2);
      const realPay = (parseFloat(this.data.totle) - parseFloat(discount)).toFixed(2);
      this.setData({
        discountMoney: discount,
        realPayMoney: realPay
      });
    })
  },
  bindPickerChange(e) {
    const index = e.detail.value,
      chooseCoupon = this.data.canuseCoupons[index];
    console.log(chooseCoupon)
    const couponMoney = chooseCoupon && chooseCoupon.couponMoney != null ? chooseCoupon.couponMoney : "0";
    const discount = (parseFloat(couponMoney) || 0).toFixed(2);
    const realPay = (parseFloat(this.data.totle) - parseFloat(discount)).toFixed(2);
    this.setData({
      couponIndex: index,
      discountMoney: discount,
      realPayMoney: realPay
    })
  },
  getGoods(indexs, totle) {
    const { id: userId } = app.globalData.user;
    util.get("api/market/cart_list", {
      userId
    }).then((data) => {
      let list = [];
      indexs.split(',').forEach((v) => {
        list.push(data[v])
      })
      console.log(list);
      this.setData({
        totle,
        list
      });
    })
  },
  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },
  chooseAddress() {
    const that = this;
    wx.chooseAddress({
      success: function (res) {
        const detail = res.provinceName + res.cityName + res.countyName + res.detailInfo;
        that.setData({
          address: {
            name: res.userName,
            tel: res.telNumber,
            detail
          }
        })
      }
    })
  },
  async submitOrder(e) {
    if (!this.data.address) {
      wx.showToast({ title: '请选择服务地址', icon: 'none' })
      return
    }
    const {
      address: { name: userName, tel: userMobile, detail: saveGoodsAdd },
      list: goodsList,
      shopId
    } = this.data;

    // 如果有 shopId，优先尝试走新的 market 订单链路（BE 返回 code!=0 时直接提示并终止）
    if (shopId) {
      try {
        const ok = await this.submitMarketOrder(userName, userMobile, saveGoodsAdd, goodsList, shopId);
        if (ok === false) return;
      } catch (err) {
        // 只有网络/异常才回退到旧流程
        this.submitLegacyOrder(e, userName, userMobile, saveGoodsAdd, goodsList);
      }
    } else {
      this.submitLegacyOrder(e, userName, userMobile, saveGoodsAdd, goodsList);
    }
  },
  async submitMarketOrder(userName, userMobile, saveGoodsAdd, goodsList, shopId) {
    const { id: userId } = app.globalData.user || {};
    if (!userId) throw new Error('no user');
    const items = goodsList.map(it => ({
      goods_id: it.goodsId,
      quantity: it.goodsNum
    }));
    wx.showLoading({ title: '提交订单中...', mask: true });
    try {
      const res = await util.post('market/orders', {
        shop_id: shopId,
        items,
        receiver_name: userName,
        receiver_phone: userMobile,
        receiver_address: saveGoodsAdd
      });
      // BE 在库存不足等错误时可能返回：{ code: 20012, msg: '...', data: null }
      // 此时 util.post 可能直接 resolve 原对象（因为 data.data 为 null）
      if (res && typeof res === 'object' && res.code != null && res.code !== 0) {
        wx.hideLoading();
        wx.showToast({ title: res.msg || '下单失败', icon: 'none' });
        return false;
      }

      const data = res && res.data ? res.data : res;
      const orderNo = data && (data.order_no || data.orderNo);
      wx.hideLoading();

      if (!orderNo) {
        wx.showToast({ title: '下单成功但未返回订单号', icon: 'none' });
        return false;
      }

      // 下单成功后继续：发起支付
      wx.showToast({ title: '下单成功，准备支付', icon: 'success' });
      await this.startMarketPaymentFlow(orderNo);
      return true;
    } catch (err) {
      wx.hideLoading();
      throw err;
    }
  },
  async startMarketPaymentFlow(orderNo) {
    try {
      wx.showLoading({ title: '拉起支付中...', mask: true });

      const payRes = await util.post('market/payments/create', { order_no: orderNo });
      const payData = payRes && payRes.data ? payRes.data : payRes;

      // 调试辅助：如 BE 返回 out_trade_no，可用于后端模拟回调
      const outTradeNo = payData && (payData.out_trade_no || payData.outTradeNo);
      if (outTradeNo) {
        wx.setStorageSync('last_market_out_trade_no', outTradeNo);
      }
      wx.setStorageSync('last_market_order_no', orderNo);

      wx.hideLoading();

      const payParams = this.extractWxPayParams(payData);
      if (payParams) {
        wx.showToast({ title: '正在拉起支付', icon: 'none' });
        wx.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType,
          paySign: payParams.paySign,
          success: async () => {
            wx.showToast({ title: '支付成功，查询订单状态中...', icon: 'none' });
            await this.pollMarketPayStatus(orderNo, { redirectToDetail: true });
          },
          fail: async () => {
            wx.showToast({ title: '取消支付或支付失败', icon: 'none' });
            // 失败也去查一次，避免状态不同步（例如回调成功但本地未触发 success）
            await this.pollMarketPayStatus(orderNo, { quiet: true, redirectToDetail: true });
          }
        });
      } else {
        // 若后端未提供可直接 requestPayment 的参数，则直接轮询支付状态
        await this.pollMarketPayStatus(orderNo, { redirectToDetail: true });
      }
    } catch (e) {
      wx.hideLoading();
      // 支付参数接口失败也需要给用户可见反馈
      wx.showToast({ title: '支付发起失败，请稍后再试', icon: 'none' });
    }
  },
  extractWxPayParams(payData) {
    if (!payData) return null;
    // 兼容：可能直接在对象上，也可能在嵌套字段内
    const p = payData.pay_params || payData.wx_pay_params || payData;
    const timeStamp = p.timeStamp || p.timestamp || p.time_stamp;
    const nonceStr = p.nonceStr || p.nonce_str;
    const pkg = p.package || p.pkg || p.pack;
    const signType = p.signType || p.sign_type;
    const paySign = p.paySign || p.pay_sign || p.sign;

    if (timeStamp && nonceStr && pkg && signType && paySign) {
      return { timeStamp, nonceStr, package: pkg, signType, paySign };
    }
    return null;
  },
  pollMarketPayStatus(orderNo, { quiet = false, redirectToDetail = false } = {}) {
    const self = this;
    const tryTimes = 6; // 6次 * 1500ms = 9s
    const intervalMs = 1500;
    let count = 0;

    return new Promise((resolve) => {
      const tick = async () => {
        count += 1;
        try {
          const statusRes = await util.get('market/payments/status', { order_no: orderNo });
          const statusData = statusRes && statusRes.data ? statusRes.data : statusRes;
          const payStatus = statusData && (statusData.pay_status || statusData.payStatus);
          if (!quiet) {
            // 可选：弱提示，避免刷屏（这里只在最后两次不 quiet 的时候显示一次）
            if (count >= tryTimes - 1) {
              wx.showToast({ title: `支付状态：${payStatus || 'unknown'}`, icon: 'none' });
            }
          }

          if (payStatus === 'paid' || payStatus === 'success' || payStatus === 'paid_success') {
            wx.showToast({ title: '支付成功', icon: 'success' });
            if (redirectToDetail) {
              wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
            }
            resolve(true);
            return;
          }

          if (count >= tryTimes) {
            wx.showToast({ title: `支付结束但未确认（状态：${payStatus || 'unknown'}）`, icon: 'none' });
            if (redirectToDetail) {
              wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
            }
            resolve(false);
            return;
          }
          setTimeout(tick, intervalMs);
        } catch (e) {
          if (count >= tryTimes) {
            if (!quiet) wx.showToast({ title: '查询支付状态失败', icon: 'none' });
            if (redirectToDetail) {
              wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
            }
            resolve(false);
            return;
          }
          setTimeout(tick, intervalMs);
        }
      };
      tick();
    });
  },
  submitLegacyOrder(e, userName, userMobile, saveGoodsAdd, goodsList) {
    const { id: userId, opId: openId } = app.globalData.user;
    const { formId: remark5 } = e.detail;
    const chooseCoupon = this.data.canuseCoupons[this.data.couponIndex],
      newManCoupon = chooseCoupon ? chooseCoupon.couponId : '';
    util.post('api/wx/goods_order', {
      userName,
      userId,
      saveGoodsAdd,
      userMobile,
      newManCoupon,
      remark5,
      goodsList
    }).then((data) => {
      const { orderSn, orderActulPrice } = data;
      if (orderActulPrice == 0) {
        sucessCallBack();
      } else {
        util.post('api/wx/goods_order/sign', {
          orderSn,
          openId
        }).then((data) => {
          const { nonceStr, package: packages, paySign, signType, timeStamp } = data;
          wx.requestPayment({
            'timeStamp': timeStamp,
            'nonceStr': nonceStr,
            'package': packages,
            'signType': signType,
            'paySign': paySign,
            'success': function (res) {
              sucessCallBack();
            },
            'fail': function (res) {
              wx.showToast({
                title: '取消支付'
              })
              setTimeout(() => {
                wx.redirectTo({
                  url: '../gorder-list/gorder-list',
                })
              }, 1000)
            }
          })
        })
      }
      function sucessCallBack() {
        util.get("api/wx/goods_payback/" + orderSn).then((data) => {
          console.log("data")
          console.log(data)
          wx.showToast({
            title: '支付成功'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '../gorder-detail/gorder-detail?orderSn=' + orderSn,
            })
          }, 1000)
        })
      }
    })
  }
})
