import { defineStore } from 'pinia'
import { surveyApi } from '@/api/surveyApi'
import { mockSurveyQuestions } from '@/data/mockSurveyQuestions'
import { useAuthStore } from '@/stores/authStore'

// 15문항 × (1/3/6/8)점 → 원점수 15~120 → 100점 만점으로 정규화
const SCORE_MIN = 15
const SCORE_MAX = 120

function normalizeScore(raw) {
  return Math.round((raw - SCORE_MIN) / (SCORE_MAX - SCORE_MIN) * 100)
}

const RESULT_TYPES = [
  {
    minScore: 0,
    maxScore: 19,
    type: '안정형',
    description:
      '원금 손실을 거의 원하지 않고, 예금이나 적금 수준의 안정성을 가장 중요하게 생각하는 유형입니다.',
  },
  {
    minScore: 20,
    maxScore: 38,
    type: '안정추구형',
    description:
      '안정성을 우선하지만 예·적금보다 높은 수익을 위해 일부 변동성은 감수할 수 있는 유형입니다.',
  },
  {
    minScore: 39,
    maxScore: 57,
    type: '위험중립형',
    description:
      '투자에는 위험이 따른다는 점을 이해하고 있으며, 수익과 안정성의 균형을 추구하는 유형입니다.',
  },
  {
    minScore: 58,
    maxScore: 76,
    type: '적극투자형',
    description:
      '일정 수준의 손실을 감수하더라도 시장 평균 이상의 수익을 추구하는 유형입니다.',
  },
  {
    minScore: 77,
    maxScore: 100,
    type: '공격투자형',
    description:
      '높은 수익을 위해 큰 변동성과 손실 가능성도 적극적으로 감수할 수 있는 유형입니다.',
  },
]

// mock 데이터에 choice.id 부여 (백엔드 fixture pk 와 일치: qi*4 + ci + 1)
const QUESTIONS = mockSurveyQuestions.map((q, qi) => ({
  ...q,
  choices: q.choices.map((c, ci) => ({ ...c, id: qi * 4 + ci + 1 })),
}))

function localCalc(answers) {
  const raw   = answers.reduce((s, a) => s + (a?.score ?? 0), 0)
  const score = normalizeScore(raw)
  const found = RESULT_TYPES.find((r) => score >= r.minScore && score <= r.maxScore)
  return {
    riskScore:         score,
    resultType:        found?.type        ?? '위험중립형',
    resultDescription: found?.description ?? '위험과 수익 사이의 균형을 추구합니다.',
  }
}

export const useSurveyStore = defineStore('survey', {
  state: () => ({
    questions:            QUESTIONS,   // mock 데이터 고정 — 항상 15개
    currentQuestionIndex: 0,
    answers:              [],
    riskScore:            0,
    resultType:           null,
    resultDescription:    null,
    isSubmitting:         false,
  }),

  actions: {
    // 문항은 mock 고정이므로 별도 로드 불필요.
    // SurveyQuestionView에서 onMounted 시 이 함수를 호출하지만 아무것도 하지 않아도 됨.
    loadQuestions() {},

    setAnswer(questionIndex, choiceIndex, score, choiceId, questionId) {
      this.answers[questionIndex] = { questionIndex, choiceIndex, score, choiceId, questionId }
    },

    async calculateResult() {
      this.isSubmitting = true

      // 1) 로컬 계산 — 즉시 결과 확정
      const local            = localCalc(this.answers)
      this.riskScore         = local.riskScore
      this.resultType        = local.resultType
      this.resultDescription = local.resultDescription

      // 2) 백엔드에 결과 저장 시도 (실패해도 로컬 결과 유지)
      const authStore = useAuthStore()
      try {
        const apiAnswers = this.answers.map((a) => ({
          question_id: a.questionId,
          choice_id:   a.choiceId,
        }))
        const result = await surveyApi.submit(apiAnswers)
        this.riskScore         = result.risk_score
        this.resultType        = result.result_type
        this.resultDescription = result.result_description

        // authStore.user에도 즉시 반영 (페이지 이동/새로고침 전에도 점수 표시)
        if (authStore.user) {
          authStore.user = {
            ...authStore.user,
            risk_score:      result.risk_score,
            investment_type: result.result_type,
          }
          localStorage.setItem('finfit_user', JSON.stringify(authStore.user))
        }
      } catch (_) {
        // API 실패해도 로컬 결과를 authStore에 저장해 세션 내 표시 유지
        if (authStore.user) {
          authStore.user = {
            ...authStore.user,
            risk_score:      this.riskScore,
            investment_type: this.resultType,
          }
          localStorage.setItem('finfit_user', JSON.stringify(authStore.user))
        }
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
