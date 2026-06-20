import { defineStore } from 'pinia'
import { mockCommunityPosts, nextPostId, nextCommentId } from '@/data/mockCommunityPosts'

export const useCommunityStore = defineStore('community', {
  state: () => ({
    posts: mockCommunityPosts.map(p => ({ ...p, comments: p.comments.map(c => ({ ...c })) })),
    activeFilter: null,
  }),
  getters: {
    filteredPosts: (state) =>
      state.activeFilter ? state.posts.filter(p => p.riskType === state.activeFilter) : state.posts,
    getPost: (state) => (id) => state.posts.find(p => p.id === Number(id)),
  },
  actions: {
    setFilter(type) {
      this.activeFilter = this.activeFilter === type ? null : type
    },
    toggleLike(postId) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
    },
    // authorId는 선택 옵션 (기존 호출 유지 호환)
    addComment(postId, text, author, authorInitial, authorId) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return
      post.comments.push({
        id: nextCommentId(),
        author,
        authorInitial,
        authorId: authorId ?? null,
        text,
      })
    },
    deleteComment(postId, commentId) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return
      post.comments = post.comments.filter(c => c.id !== commentId)
    },
    createPost({ title, content, author, authorInitial, riskType, authorId }) {
      this.posts.unshift({
        id: nextPostId(),
        title,
        content,
        author,
        authorInitial,
        authorId: authorId ?? null,
        riskType,
        likes: 0,
        liked: false,
        comments: [],
        createdAt: new Date().toISOString().slice(0, 10),
      })
    },
    deletePost(postId) {
      this.posts = this.posts.filter(p => p.id !== postId)
    },
  },
})
