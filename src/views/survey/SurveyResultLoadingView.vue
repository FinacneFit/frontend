<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/surveyStore'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'

const router      = useRouter()
const surveyStore = useSurveyStore()

onMounted(async () => {
  await surveyStore.calculateResult()
  router.push('/survey/result')
})
</script>

<template>
  <AuthSurveyLayout :wide="true">
    <div class="loading-body">
      <div class="spinner" />
      <p class="loading-title">분석중입니다.</p>
      <p class="loading-sub">조금만 기다려주세요.</p>
    </div>
  </AuthSurveyLayout>
</template>

<style scoped>
.loading-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid #e5e7eb;
  border-top-color: #1b78fd;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  color: #000;
  text-align: center;
}

.loading-sub {
  margin-top: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #787878;
  text-align: center;
}
</style>
