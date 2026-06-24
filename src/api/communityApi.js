import { client } from './client'

export const communityApi = {
  getPosts:      (riskType = null) => client.get(`/community/posts/${riskType ? `?risk_type=${encodeURIComponent(riskType)}` : ''}`),
  getPost:       (id)              => client.get(`/community/posts/${id}/`),
  getMyPosts:    ()                => client.get('/community/posts/my/'),
  createPost:    (data)            => client.post('/community/posts/', data),
  updatePost:    (id, data)        => client.patch(`/community/posts/${id}/`, data),
  deletePost:    (id)              => client.delete(`/community/posts/${id}/`),
  toggleLike:    (postId)          => client.post(`/community/posts/${postId}/like/`),
  addComment:    (postId, text) => client.post(`/community/posts/${postId}/comments/`, { text }),
  addReply:      (postId, parentId, text) => client.post(
    `/community/posts/${postId}/comments/${parentId}/replies/`,
    { text },
  ),
  updateComment: (postId, cid, text) => client.patch(`/community/posts/${postId}/comments/${cid}/`, { text }),
  deleteComment: (postId, cid)     => client.delete(`/community/posts/${postId}/comments/${cid}/`),
}
