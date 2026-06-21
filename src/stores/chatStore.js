import { defineStore } from 'pinia'
import { chatApi } from '@/api/chatApi'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [
      { role: 'bot', text: '안녕하세요! 추천 종목을 담으면 포트폴리오를 분석해드릴게요.' },
    ],
    isTyping: false,
  }),

  actions: {
    async sendMessage(text) {
      this.messages.push({ role: 'user', text })
      this.isTyping = true
      try {
        const { reply } = await chatApi.sendMessage(text)
        this.messages.push({ role: 'bot', text: reply })
      } catch (err) {
        this.messages.push({ role: 'bot', text: '오류가 발생했습니다. 다시 시도해주세요.' })
      } finally {
        this.isTyping = false
      }
    },

    askReason(stockName) {
      this.sendMessage(`${stockName}를 추천한 이유를 알려줘.`)
    },
  },
})
