<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/surveyStore'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'

const router      = useRouter()
const surveyStore = useSurveyStore()
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''
  try {
    await surveyStore.calculateResult()
    router.replace('/survey/result')
  } catch (err) {
    errorMessage.value = err.message
  }
}

onMounted(submit)
</script>

<template>
  <AuthSurveyLayout :wide="true">
    <div class="loading-body">
      <template v-if="!errorMessage">
        <div class="spinner" />
        <p class="loading-title">분석중입니다.</p>
        <p class="loading-sub">조금만 기다려주세요.</p>
      </template>
      <template v-else>
        <p class="error-title">저장하지 못했습니다.</p>
        <p class="loading-sub">{{ errorMessage }}</p>
        <div class="error-actions">
          <button class="btn-secondary" @click="router.replace('/survey/question')">응답 확인</button>
          <button class="btn-retry" @click="submit">다시 시도</button>
        </div>
      </template>
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

.error-title { font-size: 24px; font-weight: 700; color: #dc2626; }
.error-actions { display: flex; gap: 10px; margin-top: 24px; }
.btn-secondary, .btn-retry { border-radius: 10px; padding: 10px 18px; cursor: pointer; }
.btn-secondary { border: 1px solid #d1d5db; background: #fff; color: #374151; }
.btn-retry { border: none; background: #1b78fd; color: #fff; }
</style>
