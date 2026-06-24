import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { useChatStore } from '@/stores/chatStore'

const TOKEN_KEY = 'finfit_token'
const USER_KEY  = 'finfit_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:      JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
    token:     localStorage.getItem(TOKEN_KEY) ?? null,
    isLoading: false,
    error:     null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    _persist(user, token) {
      this.user  = user
      this.token = token
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      // 로그인한 유저의 채팅 기록 로드
      useChatStore().initForUser(user.id)
    },

    _clear() {
      // 로그아웃 시 채팅 초기화 (기록은 localStorage에 유지)
      useChatStore().reset()
      this.user  = null
      this.token = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },

    async signup(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const { user, token } = await authApi.signup(credentials)
        this._persist(user, token)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async login(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const { user, token } = await authApi.login(credentials)
        this._persist(user, token)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try { await authApi.logout() } catch (_) {}
      this._clear()
    },

    async updateBio(bio) {
      try {
        const user = await authApi.updateMe({ bio })
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } catch (err) {
        if (this.user) this.user.bio = bio
      }
    },

    async refreshMe() {
      if (!this.token) return
      try {
        const user = await authApi.getMe()
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        return user
      } catch (_) {
        // 네트워크 오류 시 기존 세션 유지 (401 전용 로그아웃은 각 API 호출 지점에서 처리)
      }
    },
  },
})
