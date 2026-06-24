import { defineStore } from 'pinia'
import { followApi } from '@/api/followApi'

function mapUser(u) {
  return {
    id:             u.id,
    nickname:       u.nickname,
    bio:            u.bio            ?? '',
    profileImage:   u.profile_image  ?? '',
    investmentType: u.investment_type ?? '미설정',
    followerCount:  u.follower_count  ?? 0,
    followingCount: u.following_count ?? 0,
    postCount:      u.post_count      ?? 0,
  }
}

export const useFollowStore = defineStore('follow', {
  state: () => ({
    followers: [],
    following: [],
  }),

  getters: {
    followerIds:    (state) => state.followers.map((u) => u.id),
    followingIds:   (state) => state.following.map((u) => u.id),
    followerCount:  (state) => state.followers.length,
    followingCount: (state) => state.following.length,
    isFollowing:    (state) => (userId) => state.following.some((u) => u.id === userId),
  },

  actions: {
    async loadFollowers() {
      try {
        this.followers = (await followApi.getFollowers()).map(mapUser)
      } catch (err) {
        console.error('팔로워 로드 실패:', err)
      }
    },

    async loadFollowing() {
      try {
        this.following = (await followApi.getFollowing()).map(mapUser)
      } catch (err) {
        console.error('팔로잉 로드 실패:', err)
      }
    },

    async follow(userId) {
      try {
        await followApi.follow(userId)
        await this.loadFollowing()
      } catch (err) {
        console.error('팔로우 실패:', err)
      }
    },

    async unfollow(userId) {
      this.following = this.following.filter((u) => u.id !== userId)
      try {
        await followApi.unfollow(userId)
      } catch (err) {
        await this.loadFollowing()
        console.error('언팔로우 실패:', err)
      }
    },

    async toggleFollow(userId) {
      if (this.isFollowing(userId)) await this.unfollow(userId)
      else                          await this.follow(userId)
    },
  },
})
