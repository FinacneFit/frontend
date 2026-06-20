import { defineStore } from 'pinia'

// 초기값: 현재 유저(id=99)가 팔로우하는 IDs
const INIT_FOLLOWING = [1, 3]
// 초기값: 현재 유저를 팔로우하는 IDs (상대방 행동 시뮬레이션)
const INIT_FOLLOWERS = [2, 4]

export const useFollowStore = defineStore('follow', {
  state: () => ({
    followingIds: [...INIT_FOLLOWING],
    followerIds:  [...INIT_FOLLOWERS],
  }),

  getters: {
    isFollowing:   (state) => (userId) => state.followingIds.includes(userId),
    followingCount:(state) => state.followingIds.length,
    followerCount: (state) => state.followerIds.length,
  },

  actions: {
    toggleFollow(userId) {
      const idx = this.followingIds.indexOf(userId)
      if (idx >= 0) {
        this.followingIds.splice(idx, 1)
      } else {
        this.followingIds.push(userId)
      }
    },
    follow(userId) {
      if (!this.followingIds.includes(userId)) this.followingIds.push(userId)
    },
    unfollow(userId) {
      this.followingIds = this.followingIds.filter(id => id !== userId)
    },
  },
})
