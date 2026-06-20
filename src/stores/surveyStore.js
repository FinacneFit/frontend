import { defineStore } from 'pinia'

const RESULT_TYPES = [
  {
    minScore: 5,
    maxScore: 12,
    type: '안정형',
    description: '안정성을 최우선으로 여기며 원금 보전에 집중합니다.',
  },
  {
    minScore: 13,
    maxScore: 20,
    type: '안정추구형',
    description: '안정성을 추구하며 소폭의 수익을 선호합니다.',
  },
  {
    minScore: 21,
    maxScore: 28,
    type: '위험중립형',
    description: '위험과 수익 사이의 균형을 추구합니다.',
  },
  {
    minScore: 29,
    maxScore: 34,
    type: '적극투자형',
    description: '높은 수익을 위해 어느 정도의 위험을 감수합니다.',
  },
  {
    minScore: 35,
    maxScore: 40,
    type: '공격투자형',
    description: '고위험 고수익을 추구하며 공격적으로 투자합니다.',
  },
]

export const useSurveyStore = defineStore('survey', {
  state: () => ({
    currentQuestionIndex: 0,
    answers: [],
    riskScore: 0,
    resultType: null,
    resultDescription: null,
  }),

  actions: {
    setAnswer(questionIndex, choiceIndex, score) {
      this.answers[questionIndex] = { questionIndex, choiceIndex, score }
    },

    calculateResult() {
      this.riskScore = this.answers.reduce((sum, a) => sum + (a?.score ?? 0), 0)
      const found = RESULT_TYPES.find(
        (r) => this.riskScore >= r.minScore && this.riskScore <= r.maxScore,
      )
      this.resultType = found?.type ?? '위험중립형'
      this.resultDescription = found?.description ?? '위험과 수익 사이의 균형을 추구합니다.'
    },

    reset() {
      this.currentQuestionIndex = 0
      this.answers = []
      this.riskScore = 0
      this.resultType = null
      this.resultDescription = null
    },
  },
})
