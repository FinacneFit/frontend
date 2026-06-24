import { defineStore } from 'pinia'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/stores/authStore'

const KEY_PREFIX  = 'finfit_chat'
const INITIAL_MSG = { role: 'bot', text: '안녕하세요! 추천 종목을 담으면 포트폴리오를 분석해드릴게요.' }

function chatKey(userId) {
  return userId ? `${KEY_PREFIX}_${userId}` : null
}

function loadMessages(userId) {
  const key = chatKey(userId)
  if (!key) return [INITIAL_MSG]
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : [INITIAL_MSG]
  } catch {
    return [INITIAL_MSG]
  }
}

function getInitialUserId() {
  try {
    const userData = JSON.parse(localStorage.getItem('finfit_user') ?? 'null')
    return userData?.id ?? null
  } catch {
    return null
  }
}

export const useChatStore = defineStore('chat', {
  state: () => {
    const userId = getInitialUserId()
    return {
      messages: loadMessages(userId),
      isTyping: false,
      userId,
    }
  },

  actions: {
    // 로그인 후 해당 유저의 대화 기록 로드
    initForUser(userId) {
      this.userId   = userId
      this.messages = loadMessages(userId)
    },

    // 로그아웃 시 초기화
    reset() {
      this.userId   = null
      this.messages = [INITIAL_MSG]
    },

    _save() {
      const key = chatKey(this.userId)
      if (key) localStorage.setItem(key, JSON.stringify(this.messages))
    },

    clearHistory() {
      this.messages = [INITIAL_MSG]
      const key = chatKey(this.userId)
      if (key) localStorage.removeItem(key)
    },

    async sendMessage(text) {
      const authStore = useAuthStore()
      const history   = this.messages.filter((m) => m.role !== 'bot' || this.messages.indexOf(m) > 0)
      this.messages.push({ role: 'user', text })
      this.isTyping = true
      const userContext = {
        investment_type: authStore.user?.investment_type || '',
        risk_score:      authStore.user?.risk_score      || 0,
      }
      try {
        const { reply } = await chatApi.sendMessage(text, history, userContext)
        this.messages.push({ role: 'bot', text: reply })
      } catch {
        this.messages.push({ role: 'bot', text: '오류가 발생했습니다. 다시 시도해주세요.' })
      } finally {
        this.isTyping = false
        this._save()
      }
    },

    askReason(stockName) {
      this.sendMessage(`${stockName}를 추천한 이유를 알려줘.`)
    },
  },
})
