import { defineStore } from 'pinia'
import { portfolioApi } from '@/api/portfolioApi'

function mapHolding(h) {
  return {
    id:           h.id,
    stockId:      h.stock.id,
    name:         h.stock.name,
    code:         h.stock.code,
    category:     h.stock.category,
    currentPrice: h.current_price,
    buyPrice:     h.buy_price,
    qty:          h.qty,
    value:        h.value,
    invested:     h.invested,
    return:       h.return,
    returnRate:   h.return_rate,
    proportion:   h.proportion,
  }
}

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
        const data           = await portfolioApi.getPortfolio()
        this.holdings        = (data.holdings ?? []).map(mapHolding)
        this.totalValue      = data.total_value      ?? 0
        this.totalInvested   = data.total_invested   ?? 0
        this.totalReturn     = data.total_return     ?? 0
        this.totalReturnRate = data.total_return_rate ?? 0
      } catch (err) {
        console.error('포트폴리오 로드 실패:', err)
      } finally {
        this.isLoading = false
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
