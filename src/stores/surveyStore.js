import { defineStore } from 'pinia'
import { surveyApi } from '@/api/surveyApi'

export const useSurveyStore = defineStore('survey', {
  state: () => ({
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    riskScore: 0,
    resultType: null,
    resultDescription: null,
    isSubmitting: false,
  }),

  actions: {
    async loadQuestions() {
      if (this.questions.length) return
      try {
        this.questions = await surveyApi.getQuestions()
      } catch (err) {
        console.error('설문 문항 로드 실패:', err)
      }
    },

    setAnswer(questionIndex, choiceIndex, score, choiceId, questionId) {
      this.answers[questionIndex] = { questionIndex, choiceIndex, score, choiceId, questionId }
    },

    async calculateResult() {
      this.isSubmitting = true
      try {
        const answers = this.answers.map((a) => ({
          question_id: a.questionId,
          choice_id: a.choiceId,
        }))
        const result = await surveyApi.submit(answers)
        this.riskScore         = result.risk_score
        this.resultType        = result.result_type
        this.resultDescription = result.result_description
      } catch (err) {
        const score = this.answers.reduce((s, a) => s + (a?.score ?? 0), 0)
        this.riskScore = score
        const TYPES = [
          [5,  12, '안정형',     '안정성을 최우선으로 여기며 원금 보전에 집중합니다.'],
          [13, 20, '안정추구형', '안정성을 추구하며 소폭의 수익을 선호합니다.'],
          [21, 28, '위험중립형', '위험과 수익 사이의 균형을 추구합니다.'],
          [29, 34, '적극투자형', '높은 수익을 위해 어느 정도의 위험을 감수합니다.'],
          [35, 40, '공격투자형', '고위험 고수익을 추구하며 공격적으로 투자합니다.'],
        ]
        const found = TYPES.find(([min, max]) => score >= min && score <= max)
        this.resultType        = found?.[2] ?? '위험중립형'
        this.resultDescription = found?.[3] ?? '위험과 수익 사이의 균형을 추구합니다.'
      } finally {
        this.isSubmitting = false
      }
    },

    reset() {
      this.currentQuestionIndex = 0
      this.answers              = []
      this.riskScore            = 0
      this.resultType           = null
      this.resultDescription    = null
    },
  },
})
