<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()

const nickname = authStore.user?.nickname ?? '회원'

function startSurvey() {
  surveyStore.reset()
  router.push('/survey/question')
}
</script>

<template>
  <AuthSurveyLayout :wide="true">
    <div class="intro-body">
      <p class="heading">
        <span class="name-gradient">{{ nickname }}</span>님, 만나서 반가워요.
      </p>
      <p class="subtext">성향을 파악하기 위해 간단한 설문조사를 진행할게요.</p>
      <button class="btn-start" @click="startSurvey">설문 시작하기 &gt;</button>
    </div>
  </AuthSurveyLayout>
</template>

<style scoped>
.intro-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.heading {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  color: #000;
  text-align: center;
  white-space: nowrap;
}

.name-gradient {
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtext {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: #000;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 40px;
}

.btn-start {
  background: #1b78fd;
  border: none;
  border-radius: 14px;
  padding: 14px 32px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn-start:hover {
  opacity: 0.88;
}
</style>
