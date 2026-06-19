import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async signup(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const { user, token } = await authApi.signup(credentials)
        this.user = user
        this.token = token
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
        this.user = user
        this.token = token
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
    },
  },
})
