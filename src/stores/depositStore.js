import { defineStore } from 'pinia'
import { depositApi } from '@/api/depositApi'

export const useDepositStore = defineStore('deposit', {
  state: () => ({
    products: [],
    isLoading: false,
    savedIds: new Set(JSON.parse(localStorage.getItem('finfit_saved_deposits') ?? '[]')),
  }),

  actions: {
    async loadProducts() {
      this.isLoading = true
      try {
        this.products = await depositApi.getList()
      } finally {
        this.isLoading = false
      }
    },

    async saveProduct(productId, memo) {
      await depositApi.save(productId, memo)
      this.savedIds.add(productId)
      localStorage.setItem('finfit_saved_deposits', JSON.stringify([...this.savedIds]))
    },

    async refreshFromFSS() {
      this.isLoading = true
      try {
        await depositApi.refresh()
        await this.loadProducts()
      } finally {
        this.isLoading = false
      }
    },

    isSaved(productId) {
      return this.savedIds.has(productId)
    },
  },
})
