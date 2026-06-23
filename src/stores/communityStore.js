import { defineStore } from 'pinia'
import { communityApi } from '@/api/communityApi'

function mapPost(p) {
  return {
    id:            p.id,
    title:         p.title,
    content:       p.content,
    riskType:      p.risk_type,
    author:        p.author_nickname ?? p.author ?? '알 수 없음',
    authorInitial: (p.author_nickname ?? p.author ?? '?').charAt(0),
    authorId:      p.author_id,
    likes:         p.likes         ?? 0,
    liked:         p.liked         ?? false,
    commentCount:  p.comment_count ?? 0,
    comments:      (p.comments     ?? []).map(mapComment),
    createdAt:     p.created_at,
  }
}

function mapComment(c) {
  return {
    id:       c.id,
    text:     c.text,
    author:   c.author_nickname ?? c.author ?? '알 수 없음',
    initial:  (c.author_nickname ?? c.author ?? '?').charAt(0),
    authorId: c.author_id,
  }
}

export const useCommunityStore = defineStore('community', {
  state: () => ({
    posts:        [],
    activeFilter: null,
    isLoading:    false,
  }),

  getters: {
    filteredPosts: (state) =>
      state.activeFilter
        ? state.posts.filter((p) => p.riskType === state.activeFilter)
        : state.posts,

    getPost: (state) => (id) =>
      state.posts.find((p) => p.id === Number(id)) ?? null,
  },

  actions: {
    async loadPosts() {
      this.isLoading = true
      try {
        const data = await communityApi.getPosts()
        this.posts = data.map(mapPost)
      } catch (err) {
        console.error('게시글 로드 실패:', err)
      } finally {
        this.isLoading = false
      }
    },

    async loadPost(id) {
      try {
        const data = await communityApi.getPost(id)
        const post = mapPost(data)
        const idx  = this.posts.findIndex((p) => p.id === post.id)
        if (idx >= 0) this.posts[idx] = post
        else          this.posts.unshift(post)
      } catch (err) {
        console.error('게시글 로드 실패:', err)
      }
    },

    async createPost({ title, content, riskType, ..._ }) {
      const data = await communityApi.createPost({ title, content, risk_type: riskType })
      this.posts.unshift(mapPost(data))
    },

    async updatePost(postId, { title, content }) {
      const data = await communityApi.updatePost(postId, { title, content })
      const idx  = this.posts.findIndex((p) => p.id === postId)
      if (idx >= 0) this.posts[idx] = mapPost(data)
    },

    async deletePost(postId) {
      await communityApi.deletePost(postId)
      this.posts = this.posts.filter((p) => p.id !== postId)
    },

    async toggleLike(postId) {
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return
      const wasLiked = post.liked
      post.liked  = !wasLiked
      post.likes += wasLiked ? -1 : 1
      try {
        const res  = await communityApi.toggleLike(postId)
        post.liked = res.liked
        post.likes = res.likes
      } catch {
        post.liked  = wasLiked
        post.likes += wasLiked ? 1 : -1
      }
    },

    async addComment(postId, text, _author, _initial, _authorId) {
      const data = await communityApi.addComment(postId, text)
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return
      post.comments.push(mapComment(data))
      post.commentCount = post.comments.length
    },

    async updateComment(postId, commentId, text) {
      const data    = await communityApi.updateComment(postId, commentId, text)
      const post    = this.posts.find((p) => p.id === postId)
      if (!post) return
      const comment = post.comments.find((c) => c.id === commentId)
      if (comment) comment.text = data.text
    },

    async deleteComment(postId, commentId) {
      await communityApi.deleteComment(postId, commentId)
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return
      post.comments     = post.comments.filter((c) => c.id !== commentId)
      post.commentCount = post.comments.length
    },

    setFilter(type) {
      this.activeFilter = this.activeFilter === type ? null : type
    },
  },
})
