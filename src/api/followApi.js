import { client } from './client'

export const followApi = {
  getFollowers: ()       => client.get('/users/me/followers/'),
  getFollowing: ()       => client.get('/users/me/following/'),
  follow:       (userId) => client.post(`/users/${userId}/follow/`),
  unfollow:     (userId) => client.delete(`/users/${userId}/follow/`),
}
