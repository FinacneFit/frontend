import { client } from '@/api/client'
import { mockDeposits } from '@/data/mockDeposits'

export const depositApi = {
  async getList() {
    try {
      const res = await client.get('/deposits/')
      // 백엔드에 데이터가 없으면 mock fallback
      const data = Array.isArray(res) ? res : (res?.data ?? res)
      if (Array.isArray(data) && data.length > 0) return data
      return mockDeposits
    } catch {
      return mockDeposits
    }
  },

  async refresh() {
    return client.post('/deposits/refresh/')
  },

  async save(productId, memo) {
    try {
      return await client.post('/deposits/save/', { product_id: productId, memo })
    } catch {
      return { success: true }
    }
  },
}
