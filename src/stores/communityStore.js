import { defineStore } from 'pinia'
import { communityApi } from '@/api/communityApi'

function mapPost(p) {
  const comments = (p.comments ?? []).map(mapComment)
  return {
    id:            p.id,
    title:         p.title,
    content:       p.content,
    portfolioSnapshot: p.portfolio_snapshot ?? {},
    riskType:      p.risk_type,
    author:        p.author_nickname ?? p.author ?? '알 수 없음',
    authorInitial: (p.author_nickname ?? p.author ?? '?').charAt(0),
    authorId:      p.author_id,
    authorProfileImage: p.author_profile_image ?? null,
    likes:         p.likes         ?? 0,
    liked:         p.liked         ?? false,
    commentCount:  p.comment_count ?? countComments(comments),
    comments,
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
    authorProfileImage: c.author_profile_image ?? null,
    parentId: c.parent_id ?? null,
    replies:  (c.replies ?? []).map(mapComment),
  }
}

function findComment(comments, id) {
  for (const comment of comments) {
    if (comment.id === id) return comment
    const nested = findComment(comment.replies, id)
    if (nested) return nested
  }
  return null
}

function countComments(comments) {
  return comments.reduce((count, comment) => count + 1 + countComments(comment.replies), 0)
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

    async createPost({ title, content, riskType, attachStocks = false, attachDeposits = false, showReturns = true }) {
      const data = await communityApi.createPost({
        title,
        content,
        risk_type: riskType,
        attach_stock_portfolio: attachStocks,
        attach_deposit_portfolio: attachDeposits,
        show_portfolio_returns: showReturns,
      })
      this.posts.unshift(mapPost(data))
    },

    async updatePost(postId, { title, content, attachStocks, attachDeposits, showReturns }) {
      const data = await communityApi.updatePost(postId, {
        title,
        content,
        attach_stock_portfolio: attachStocks,
        attach_deposit_portfolio: attachDeposits,
        show_portfolio_returns: showReturns,
      })
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

    async addComment(postId, text, parentId = null) {
      const data = parentId === null
        ? await communityApi.addComment(postId, text)
        : await communityApi.addReply(postId, parentId, text)
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return
      const comment = mapComment(data)
      if (parentId === null) {
        post.comments.push(comment)
      } else {
        const parent = findComment(post.comments, parentId)
        if (parent) parent.replies.push(comment)
      }
      post.commentCount = countComments(post.comments)
    },

    async updateComment(postId, commentId, text) {
      const data    = await communityApi.updateComment(postId, commentId, text)
      const post    = this.posts.find((p) => p.id === postId)
      if (!post) return
      const comment = findComment(post.comments, commentId)
      if (comment) comment.text = data.text
    },

    async deleteComment(postId, commentId) {
      await communityApi.deleteComment(postId, commentId)
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return
      const parent = post.comments.find((comment) =>
        comment.replies.some((reply) => reply.id === commentId)
      )
      if (parent) parent.replies = parent.replies.filter((reply) => reply.id !== commentId)
      else post.comments = post.comments.filter((comment) => comment.id !== commentId)
      post.commentCount = countComments(post.comments)
    },

    setFilter(type) {
      this.activeFilter = this.activeFilter === type ? null : type
    },
  },
})
