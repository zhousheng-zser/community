import { defineStore } from 'pinia'
import request from '../utils/request'

export const useMarketConsoleStore = defineStore('marketConsole', {
  state: () => ({
    dashboard: null,
    dashboardLoading: false,
    shop: null
  }),
  actions: {
    initShopFromStorage() {
      const raw = localStorage.getItem('merchant_shop')
      if (!raw) {
        this.shop = null
        return
      }
      try {
        this.shop = JSON.parse(raw)
      } catch {
        this.shop = null
      }
    },
    setShopFromLogin(shop) {
      this.shop = shop || null
      if (shop) localStorage.setItem('merchant_shop', JSON.stringify(shop))
      else localStorage.removeItem('merchant_shop')
    },
    setDashboard(payload) {
      this.dashboard = payload
    },
    async fetchDashboard(force = false) {
      if (this.dashboard && !force) return this.dashboard
      this.dashboardLoading = true
      try {
        const { data } = await request.get('/market/merchant/dashboard')
        if (data.code !== 0 && data.errno !== 0) {
          throw new Error(data.msg || data.errmsg || '加载失败')
        }
        const d = data.data || {}
        this.dashboard = d
        return d
      } finally {
        this.dashboardLoading = false
      }
    },
    clearSession() {
      this.dashboard = null
      this.shop = null
    }
  }
})
