import { defineStore } from 'pinia'
import { chatApi } from '@/api/chatApi'

const CHAT_KEY = 'finfit_chat'
const INITIAL_MSG = { role: 'bot', text: '안녕하세요! 추천 종목을 담으면 포트폴리오를 분석해드릴게요.' }

function loadMessages() {
  try {
    const saved = localStorage.getItem(CHAT_KEY)
    return saved ? JSON.parse(saved) : [INITIAL_MSG]
  } catch {
    return [INITIAL_MSG]
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: loadMessages(),
    isTyping: false,
  }),

  actions: {
    _save() {
      localStorage.setItem(CHAT_KEY, JSON.stringify(this.messages))
    },

    clearHistory() {
      this.messages = [INITIAL_MSG]
      localStorage.removeItem(CHAT_KEY)
    },

    async sendMessage(text) {
      const history = this.messages.filter((m) => m.role !== 'bot' || this.messages.indexOf(m) > 0)
      this.messages.push({ role: 'user', text })
      this.isTyping = true
      try {
        const { reply } = await chatApi.sendMessage(text, history)
        this.messages.push({ role: 'bot', text: reply })
      } catch (err) {
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
