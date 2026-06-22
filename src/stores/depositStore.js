import { defineStore } from 'pinia'
import { depositApi } from '@/api/depositApi'

export const useDepositStore = defineStore('deposit', {
  state: () => ({
    products: [],
    isLoading: false,
    error: null,
    savedIds: new Set(JSON.parse(localStorage.getItem('finfit_saved_deposits') ?? '[]')),
  }),

  actions: {
    async loadProducts() {
      this.isLoading = true
      this.error = null

      try {
        const data = await depositApi.getList()

        if (Array.isArray(data)) {
          this.products = data
          return
        }

        if (Array.isArray(data?.results)) {
          this.products = data.results
          return
        }

        this.products = []
      } catch (err) {
        this.products = []
        this.error = err.message || '예금·적금 상품을 불러오지 못했습니다.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async saveProduct(productId, payload = {}) {
      await depositApi.save(productId, payload)

      this.savedIds.add(productId)
      localStorage.setItem('finfit_saved_deposits', JSON.stringify([...this.savedIds]))
    },

    async refreshFromFSS() {
      this.isLoading = true
      this.error = null

      try {
        await depositApi.refresh()
        await this.loadProducts()
      } catch (err) {
        this.error = err.message || '금융감독원 데이터 갱신에 실패했습니다.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    isSaved(productId) {
      return this.savedIds.has(productId)
    },
  },
})