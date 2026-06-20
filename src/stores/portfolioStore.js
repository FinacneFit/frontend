import { defineStore } from 'pinia'
import { mockPortfolioHoldings } from '@/data/mockStocks'

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    holdings: mockPortfolioHoldings.map(h => ({ ...h })),
  }),
  getters: {
    totalInvested: (state) => state.holdings.reduce((s, h) => s + h.buyPrice * h.qty, 0),
    totalValue: (state) => state.holdings.reduce((s, h) => s + h.currentPrice * h.qty, 0),
    returnRate(state) {
      if (this.totalInvested === 0) return 0
      return ((this.totalValue - this.totalInvested) / this.totalInvested) * 100
    },
    holdingsWithStats(state) {
      const total = this.totalValue
      return state.holdings.map(h => ({
        ...h,
        value: h.currentPrice * h.qty,
        invested: h.buyPrice * h.qty,
        returnRate: ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100,
        proportion: total > 0 ? (h.currentPrice * h.qty / total) * 100 : 0,
      }))
    },
  },
  actions: {
    updateQty(id, delta) {
      const h = this.holdings.find(h => h.id === id)
      if (h) h.qty = Math.min(9999, Math.max(1, h.qty + delta))
    },
    removeHolding(id) {
      this.holdings = this.holdings.filter(h => h.id !== id)
    },
    addStock(stock) {
      const existing = this.holdings.find(h => h.id === stock.id)
      if (existing) {
        existing.qty += 1
      } else {
        this.holdings.push({ ...stock, qty: 1, buyPrice: stock.price, currentPrice: stock.price })
      }
    },
    addHolding(stock, qty, buyPrice) {
      const existing = this.holdings.find(h => h.id === stock.id)
      if (existing) {
        // 가중평균 단가 계산
        const totalQty = existing.qty + qty
        const totalCost = existing.buyPrice * existing.qty + buyPrice * qty
        existing.buyPrice = Math.round(totalCost / totalQty)
        existing.qty = totalQty
        if (stock.price) existing.currentPrice = stock.price
      } else {
        this.holdings.push({
          id: stock.id,
          name: stock.name,
          code: stock.code,
          category: stock.category,
          qty,
          buyPrice,
          currentPrice: stock.price || buyPrice,
        })
      }
    },
  },
})
