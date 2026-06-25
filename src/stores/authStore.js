import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { useChatStore } from '@/stores/chatStore'

const ACCESS_KEY  = 'finfit_access'
const REFRESH_KEY = 'finfit_refresh'
const USER_KEY    = 'finfit_user'

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:          JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
    token:         localStorage.getItem(ACCESS_KEY) ?? null,
    refreshToken:  localStorage.getItem(REFRESH_KEY) ?? null,
    isLoading:     false,
    error:         null,
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => {
      if (!state.token) return false
      return !isTokenExpired(state.token)
    },
  },

  actions: {
    _persist(user, access, refresh) {
      this.user         = user
      this.token        = access
      this.refreshToken = refresh
      localStorage.setItem(ACCESS_KEY,  access)
      localStorage.setItem(REFRESH_KEY, refresh)
      localStorage.setItem(USER_KEY,    JSON.stringify(user))
      useChatStore().initForUser(user.id)
    },

    _clear() {
      useChatStore().reset()
      this.user         = null
      this.token        = null
      this.refreshToken = null
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    },

    updateAccessToken(newToken) {
      this.token = newToken
    },

    async signup(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const { user, access, refresh } = await authApi.signup(credentials)
        this._persist(user, access, refresh)
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
        const { user, access, refresh } = await authApi.login(credentials)
        this._persist(user, access, refresh)
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

    async refreshMe() {
      if (!this.token) {
        this.isInitialized = true
        return
      }
      try {
        const user = await authApi.getMe()
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } catch (err) {
        if (err.status === 401) {
          this._clear()
        }
        // 네트워크 에러(서버 꺼짐 등)는 세션 유지
      } finally {
        this.isInitialized = true
      }
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

    async updateProfileImage(file) {
      const user = await authApi.uploadProfileImage(file)
      this.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },

    async removeProfileImage() {
      const user = await authApi.removeProfileImage()
      this.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
  },
})
