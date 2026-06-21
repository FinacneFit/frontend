import { client } from './client'

export const communityApi = {
  getPosts:      (riskType = null) => client.get(`/community/posts/${riskType ? `?risk_type=${encodeURIComponent(riskType)}` : ''}`),
  getPost:       (id)              => client.get(`/community/posts/${id}/`),
  getMyPosts:    ()                => client.get('/community/posts/my/'),
  createPost:    (data)            => client.post('/community/posts/', data),
  deletePost:    (id)              => client.delete(`/community/posts/${id}/`),
  toggleLike:    (postId)          => client.post(`/community/posts/${postId}/like/`),
  addComment:    (postId, text)    => client.post(`/community/posts/${postId}/comments/`, { text }),
  deleteComment: (postId, cid)     => client.delete(`/community/posts/${postId}/comments/${cid}/`),
}
