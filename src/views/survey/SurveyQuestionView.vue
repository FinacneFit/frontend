<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/surveyStore'
import { mockSurveyQuestions } from '@/data/mockSurveyQuestions'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'

const router = useRouter()
const surveyStore = useSurveyStore()

const total = mockSurveyQuestions.length
const selectedChoiceIndex = ref(null)

const currentIndex = computed(() => surveyStore.currentQuestionIndex)
const currentQuestion = computed(() => mockSurveyQuestions[currentIndex.value])
const progressPercent = computed(() => Math.round(((currentIndex.value + 1) / total) * 100))
const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value === total - 1)
const canProceed = computed(() => selectedChoiceIndex.value !== null)

watch(
  currentIndex,
  (idx) => {
    const saved = surveyStore.answers[idx]
    selectedChoiceIndex.value = saved?.choiceIndex ?? null
  },
  { immediate: true },
)

function selectChoice(choiceIndex) {
  selectedChoiceIndex.value = choiceIndex
  const score = currentQuestion.value.choices[choiceIndex].score
  surveyStore.setAnswer(currentIndex.value, choiceIndex, score)
}

function goPrev() {
  if (isFirst.value) return
  surveyStore.currentQuestionIndex--
}

function goNext() {
  if (!canProceed.value) return
  if (isLast.value) {
    surveyStore.calculateResult()
    router.push('/survey/result/loading')
  } else {
    surveyStore.currentQuestionIndex++
  }
}
</script>

<template>
  <AuthSurveyLayout :wide="true">
    <div class="question-body">
      <!-- 진행률 -->
      <div class="progress-header">
        <span class="progress-label">{{ currentIndex + 1 }} / {{ total }}</span>
        <span class="progress-label">{{ progressPercent }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
      </div>

      <!-- 문항 -->
      <h2 class="question-text">{{ currentIndex + 1 }}. {{ currentQuestion.question }}</h2>

      <!-- 선택지 -->
      <div class="choices">
        <button
          v-for="(choice, idx) in currentQuestion.choices"
          :key="idx"
          class="choice-btn"
          :class="{ selected: selectedChoiceIndex === idx }"
          @click="selectChoice(idx)"
        >
          {{ choice.text }}
        </button>
      </div>

      <!-- 이전 / 다음 -->
      <div class="nav-row">
        <button class="btn-prev" :class="{ invisible: isFirst }" @click="goPrev">← 이전</button>
        <button class="btn-next" :class="{ disabled: !canProceed }" :disabled="!canProceed" @click="goNext">
          {{ isLast ? '완료' : '다음' }} &gt;
        </button>
      </div>
    </div>
  </AuthSurveyLayout>
</template>

<style scoped>
.question-body {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 진행률 */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #787878;
}

.progress-track {
  margin-top: 6px;
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* 문항 */
.question-text {
  margin-top: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  color: #000;
  white-space: pre-wrap;
  word-break: keep-all;
}

/* 선택지 */
.choices {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  width: 100%;
  min-height: 58px;
  background: #fff;
  border: 1px solid #9a9a9a;
  border-radius: 14px;
  padding: 12px 20px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  color: #000;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.choice-btn:hover:not(.selected) {
  border-color: #1b78fd;
}

.choice-btn.selected {
  border-color: #1b78fd;
  color: #1b78fd;
  font-weight: 700;
}

/* 이전/다음 */
.nav-row {
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-prev {
  background: none;
  border: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #787878;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
}

.btn-prev:hover {
  opacity: 0.75;
}

.btn-prev.invisible {
  visibility: hidden;
  pointer-events: none;
}

.btn-next {
  background: none;
  border: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 28px;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
}

.btn-next:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-next.disabled,
.btn-next:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
