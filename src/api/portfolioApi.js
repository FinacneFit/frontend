import { client } from './client'

export const portfolioApi = {
  getPortfolio:  ()                          => client.get('/portfolio/'),
  addHolding:    (stock_id, qty, buy_price)  => client.post('/portfolio/holdings/', { stock_id, qty, buy_price }),
  updateQty:     (holdingId, qty)            => client.patch(`/portfolio/holdings/${holdingId}/`, { qty }),
  removeHolding: (holdingId)                 => client.delete(`/portfolio/holdings/${holdingId}/`),
}
