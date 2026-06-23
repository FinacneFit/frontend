import { defineStore } from 'pinia'
import { depositApi } from '@/api/depositApi'

export const useDepositStore = defineStore('deposit', {
  state: () => ({
    products: [],
    savedDeposits: [],
    isLoading: false,
    isSaving: false,
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
        } else if (Array.isArray(data?.results)) {
          this.products = data.results
        } else {
          this.products = []
        }
      } catch (error) {
        this.products = []
        this.error = error.message || '예금·적금 상품을 불러오지 못했습니다.'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadSavedProducts() {
      this.isLoading = true
      this.error = null

      try {
        const data = await depositApi.getSavedList()

        if (Array.isArray(data)) {
          this.savedDeposits = data
        } else if (Array.isArray(data?.results)) {
          this.savedDeposits = data.results
        } else {
          this.savedDeposits = []
        }

        this.savedIds = new Set(
          this.savedDeposits
            .map((item) => item.product?.id)
            .filter(Boolean)
        )

        localStorage.setItem('finfit_saved_deposits', JSON.stringify([...this.savedIds]))
      } catch (error) {
        this.savedDeposits = []
        this.error = error.message || '담은 예금·적금 상품을 불러오지 못했습니다.'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async saveProduct(productId, payload = {}) {
      this.isSaving = true
      this.error = null

      try {
        await depositApi.save(productId, payload)

        this.savedIds.add(productId)
        localStorage.setItem('finfit_saved_deposits', JSON.stringify([...this.savedIds]))

        await this.loadSavedProducts()
      } catch (error) {
        this.error = error.message || '예금·적금 상품 담기에 실패했습니다.'
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async deleteSavedProduct(productId) {
      this.error = null

      try {
        await depositApi.deleteSaved(productId)

        this.savedDeposits = this.savedDeposits.filter(
          (item) => item.product?.id !== productId
        )

        this.savedIds.delete(productId)
        localStorage.setItem('finfit_saved_deposits', JSON.stringify([...this.savedIds]))
      } catch (error) {
        this.error = error.message || '담은 예금·적금 상품 삭제에 실패했습니다.'
        throw error
      }
    },

    async refreshFromFSS() {
      this.isLoading = true
      this.error = null

      try {
        await depositApi.refresh()
        await this.loadProducts()
      } catch (error) {
        this.error = error.message || '금융감독원 데이터 갱신에 실패했습니다.'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    isSaved(productId) {
      return this.savedIds.has(productId)
    },
  },
})