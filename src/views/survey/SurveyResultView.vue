<script setup>
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/surveyStore'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'

const router = useRouter()
const surveyStore = useSurveyStore()

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <AuthSurveyLayout :wide="true">
    <div class="result-body">
      <p class="score-label">나의 투자 성향 점수</p>

      <div class="score-box">
        <span class="score-number">{{ surveyStore.riskScore }}</span>
      </div>

      <p class="result-type">{{ surveyStore.resultType }}</p>
      <p class="result-desc">{{ surveyStore.resultDescription }}</p>

      <button class="btn-dashboard" @click="goToDashboard">
        주식 종목 추천 받고 나만의 포트폴리오 만들기 &gt;&gt;
      </button>
    </div>
  </AuthSurveyLayout>
</template>

<style scoped>
.result-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #787878;
  text-align: center;
  margin-bottom: 4px;
}

.score-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 25px 65px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.score-number {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 72px;
  line-height: 72px;
  color: #000;
}

.result-type {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 8px;
}

.result-desc {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #787878;
  text-align: center;
  margin-bottom: 32px;
}

.btn-dashboard {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: #fff;
  text-align: center;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-dashboard:hover {
  opacity: 0.88;
}
</style>
