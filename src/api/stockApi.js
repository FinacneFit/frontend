import { client } from './client'

export const stockApi = {
  getRecommended: (shuffle = false) => client.get(`/stocks/recommended/${shuffle ? '?shuffle=true' : ''}`),
  search:         (q) => client.get(`/stocks/search/?q=${encodeURIComponent(q)}`),
}
