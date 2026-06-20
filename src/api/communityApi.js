export const communityApi = {
  async getPosts() { await new Promise(r => setTimeout(r, 100)); return [] },
  async getPost(id) { await new Promise(r => setTimeout(r, 100)); return null },
  async createPost(data) { await new Promise(r => setTimeout(r, 200)); return data },
  async deletePost(id) { await new Promise(r => setTimeout(r, 100)); return true },
  async toggleLike(postId) { await new Promise(r => setTimeout(r, 100)); return true },
  async addComment(postId, text) { await new Promise(r => setTimeout(r, 100)); return { id: Date.now(), text } },
  async deleteComment(postId, commentId) { await new Promise(r => setTimeout(r, 100)); return true },
}
