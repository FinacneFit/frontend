import { client } from './client'

export const userApi = {
  getUser: (id) => client.get(`/users/${id}/`),
}
