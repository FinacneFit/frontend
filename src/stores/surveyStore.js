import { defineStore } from 'pinia'
import { surveyApi } from '@/api/surveyApi'
import { useAuthStore } from '@/stores/authStore'

export const useSurveyStore = defineStore('survey', {
  state: () => ({
    questions:            [],
    currentQuestionIndex: 0,
    answers:              [],
    riskScore:            0,
    resultType:           null,
    resultDescription:    null,
    isLoadingQuestions:   false,
    questionError:        null,
    isSubmitting:         false,
    submitError:          null,
  }),

  actions: {
    async loadQuestions(force = false) {
      if (this.questions.length && !force) return

      this.isLoadingQuestions = true
      this.questionError = null
      try {
        const questions = await surveyApi.getQuestions()
        if (!Array.isArray(questions) || questions.length !== 15) {
          throw new Error('설문 문항을 정상적으로 불러오지 못했습니다.')
        }
        this.questions = questions
      } catch (err) {
        this.questions = []
        this.questionError = err.message
        throw err
      } finally {
        this.isLoadingQuestions = false
      }
    },

    setAnswer(questionIndex, choiceIndex, score, choiceId, questionId) {
      this.answers[questionIndex] = { questionIndex, choiceIndex, score, choiceId, questionId }
    },

    async calculateResult() {
      if (this.answers.length !== this.questions.length || this.answers.some((answer) => !answer)) {
        throw new Error('모든 설문 문항에 응답해주세요.')
      }

      this.isSubmitting = true
      this.submitError = null
      try {
        const apiAnswers = this.answers.map((answer) => ({
          question_id: answer.questionId,
          choice_id: answer.choiceId,
        }))
        const result = await surveyApi.submit(apiAnswers)

        this.riskScore = result.risk_score
        this.resultType = result.result_type
        this.resultDescription = result.result_description

        // 화면 캐시가 아니라 DB에 저장된 사용자 정보를 다시 받아 단일 기준으로 사용한다.
        await useAuthStore().refreshMe()
        return result
      } catch (err) {
        this.submitError = err.message
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    reset() {
      this.currentQuestionIndex = 0
      this.answers = []
      this.riskScore = 0
      this.resultType = null
      this.resultDescription = null
      this.submitError = null
    },
  },
})
