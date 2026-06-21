import { defineStore } from 'pinia'
import { portfolioApi } from '@/api/portfolioApi'

function mapHolding(h, totalValue = 0) {
  const invested   = h.buy_price    * h.qty
  const value      = h.current_price * h.qty
  const ret        = value - invested
  const returnRate = invested > 0 ? (ret / invested) * 100 : 0
  return {
    id:           h.id,
    stockId:      h.stock_id,
    name:         h.name,
    code:         h.code,
    category:     h.category,
    currentPrice: h.current_price,
    buyPrice:     h.buy_price,
    qty:          h.qty,
    value,
    invested,
    return:       ret,
    returnRate,
    proportion:   totalValue > 0 ? (value / totalValue) * 100 : 0,
  }
}

// 폴링 타이머 (스토어 외부에서 모듈 레벨로 관리)
let _pollTimer = null

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    holdings:        [],
    totalValue:      0,
    totalInvested:   0,
    totalReturn:     0,
    totalReturnRate: 0,
    isLoading:       false,
  }),

  getters: {
    holdingsWithStats: (state) => state.holdings,
    returnRate:        (state) => state.totalReturnRate,
  },

  actions: {
    async loadPortfolio() {
      this.isLoading = true
      try {
        const data = await portfolioApi.getPortfolio()
        const raw  = data.holdings ?? []
        const totalValue = raw.reduce((s, h) => s + h.current_price * h.qty, 0)
        this.holdings        = raw.map((h) => mapHolding(h, totalValue))
        this.totalInvested   = data.total_invested ?? 0
        this.totalValue      = data.total_value    ?? totalValue
        this.totalReturn     = this.totalValue - this.totalInvested
        this.totalReturnRate = data.return_rate    ?? 0
      } catch (err) {
        console.error('포트폴리오 로드 실패:', err)
      } finally {
        this.isLoading = false
      }
    },

    // 1분마다 자동 갱신 시작
    startPolling() {
      if (_pollTimer) return
      _pollTimer = setInterval(() => this.loadPortfolio(), 60_000)
    },

    // 폴링 중단 (뷰 언마운트 시 호출)
    stopPolling() {
      if (_pollTimer) {
        clearInterval(_pollTimer)
        _pollTimer = null
      }
    },

    async addHolding(stock, qty, buyPrice) {
      try {
        await portfolioApi.addHolding(stock.id, qty, buyPrice)
        await this.loadPortfolio()
      } catch (err) {
        console.error('종목 추가 실패:', err)
        throw err
      }
    },

    async updateQty(holdingId, delta) {
      const holding = this.holdings.find((h) => h.id === holdingId)
      if (!holding) return
      const newQty = holding.qty + delta
      if (newQty < 1) return
      holding.qty = newQty
      try {
        await portfolioApi.updateQty(holdingId, newQty)
        await this.loadPortfolio()
      } catch (err) {
        holding.qty -= delta
        console.error('수량 변경 실패:', err)
      }
    },

    async removeHolding(holdingId) {
      const idx = this.holdings.findIndex((h) => h.id === holdingId)
      if (idx === -1) return
      const [removed] = this.holdings.splice(idx, 1)
      try {
        await portfolioApi.removeHolding(holdingId)
        await this.loadPortfolio()
      } catch (err) {
        this.holdings.splice(idx, 0, removed)
        console.error('종목 삭제 실패:', err)
      }
    },
  },
})
