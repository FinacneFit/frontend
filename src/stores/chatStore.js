import { defineStore } from 'pinia'

const MOCK_REASONS = {
  '삼성전자': '삼성전자는 반도체 및 전자제품 글로벌 1위 기업으로, 안정적인 배당과 반도체 슈퍼사이클 수혜가 기대됩니다. 변동성이 낮아 안정추구형 투자자에게 적합합니다.',
  'SK하이닉스': 'SK하이닉스는 HBM(고대역폭 메모리) 시장을 선도하며 AI 수요 증가의 직접 수혜주입니다. 성장성이 높지만 반도체 업황 변동 리스크도 존재합니다.',
  'KODEX 200': 'KODEX 200은 코스피 200을 추종하는 ETF로, 분산투자 효과가 뛰어나 포트폴리오 안정성을 높여줍니다. 개별 종목 리스크 없이 시장 평균 수익을 추구합니다.',
}

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
      await new Promise(r => setTimeout(r, 700))
      this.isTyping = false
      const matched = Object.keys(MOCK_REASONS).find(k => text.includes(k))
      const reply = matched
        ? MOCK_REASONS[matched]
        : '궁금한 점을 더 구체적으로 질문해 주시면 분석해드릴게요!'
      this.messages.push({ role: 'bot', text: reply })
    },
    askReason(stockName) {
      this.sendMessage(`${stockName}를 추천한 이유를 알려줘.`)
    },
  },
})
