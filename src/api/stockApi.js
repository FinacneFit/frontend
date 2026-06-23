import { client } from './client'

export const stockApi = {
  getRecommended: ()  => client.get('/stocks/recommended/'),
  search:         (q) => client.get(`/stocks/search/?q=${encodeURIComponent(q)}`),
}
