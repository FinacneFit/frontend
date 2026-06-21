import { defineStore } from 'pinia'

const RESULT_TYPES = [
  {
    minScore: 15,
    maxScore: 35,
    type: '안정형',
    description:
      '원금 손실을 거의 원하지 않고, 예금이나 적금 수준의 안정성을 가장 중요하게 생각하는 유형입니다.',
  },
  {
    minScore: 36,
    maxScore: 55,
    type: '안정추구형',
    description:
      '안정성을 우선하지만 예·적금보다 높은 수익을 위해 일부 변동성은 감수할 수 있는 유형입니다.',
  },
  {
    minScore: 56,
    maxScore: 75,
    type: '위험중립형',
    description:
      '투자에는 위험이 따른다는 점을 이해하고 있으며, 수익과 안정성의 균형을 추구하는 유형입니다.',
  },
  {
    minScore: 76,
    maxScore: 95,
    type: '적극투자형',
    description:
      '일정 수준의 손실을 감수하더라도 시장 평균 이상의 수익을 추구하는 유형입니다.',
  },
  {
    minScore: 96,
    maxScore: 120,
    type: '공격투자형',
    description:
      '높은 수익을 위해 큰 변동성과 손실 가능성도 적극적으로 감수할 수 있는 유형입니다.',
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
