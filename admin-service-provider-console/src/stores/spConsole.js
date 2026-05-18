import { defineStore } from 'pinia'
import request from '../utils/request'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export const useSpConsoleStore = defineStore('spConsole', {
  state: () => ({
    profile: null,
    dashboard: null,
    incomeDaily: [],
    dashboardLoading: false,
    incomeLoading: false
  }),
  actions: {
    initProfileFromStorage() {
      const raw = localStorage.getItem('sp_profile')
      if (!raw) {
        this.profile = null
        return
      }
      try {
        this.profile = JSON.parse(raw)
      } catch {
        this.profile = null
      }
    },
    setProfileFromLogin(p) {
      this.profile = p || null
      if (p) localStorage.setItem('sp_profile', JSON.stringify(p))
      else localStorage.removeItem('sp_profile')
    },
    mergeProfile(partial) {
      this.profile = { ...(this.profile || {}), ...partial }
      localStorage.setItem('sp_profile', JSON.stringify(this.profile))
    },
    setDashboard(payload) {
      this.dashboard = payload
    },
    setIncomeDaily(rows) {
      this.incomeDaily = Array.isArray(rows) ? rows : []
    },
    async fetchDashboard(force = false) {
      if (this.dashboard && !force) return this.dashboard
      this.dashboardLoading = true
      try {
        const res = await request.get('/service-provider-portal/dashboard')
        const data = res.data || {}
        this.dashboard = data
        return data
      } finally {
        this.dashboardLoading = false
      }
    },
    async fetchIncomeDaily(force = false) {
      if (this.incomeDaily.length && !force) return this.incomeDaily
      this.incomeLoading = true
      try {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        const res = await request.get('/service-provider-portal/finance/income/daily', {
          params: { start_date: ymd(start), end_date: ymd(end) }
        })
        if (res && typeof res.code === 'number' && res.code !== 0) {
          this.incomeDaily = []
          return this.incomeDaily
        }
        const rows = res && res.data != null ? res.data : []
        this.incomeDaily = Array.isArray(rows) ? rows : []
        return this.incomeDaily
      } finally {
        this.incomeLoading = false
      }
    },
    clearSession() {
      this.profile = null
      this.dashboard = null
      this.incomeDaily = []
    }
  }
})
