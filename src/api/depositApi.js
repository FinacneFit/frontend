import { client } from '@/api/client'

export const depositApi = {
  async getList() {
    return await client.get('/deposits/')
  },

  async refresh() {
    return await client.post('/deposits/refresh/')
  },

  async save(productId, payload = {}) {
    return await client.post('/deposits/save/', {
      product_id: productId,
      ...payload,
    })
  },

  async getSavedList() {
    return await client.get('/deposits/saved/')
  },

  async deleteSaved(productId) {
    return await client.delete(`/deposits/saved/${productId}/`)
  },
}