<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'

const router = useRouter()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()

const nickname = authStore.user?.nickname ?? '사용자'
const email = authStore.user?.email ?? ''
const resultType = surveyStore.resultType ?? '-'
const riskScore = surveyStore.riskScore ?? 0
</script>

<template>
  <div class="mypage-shell">
    <header class="mp-header">
      <button class="logo-btn" @click="router.push('/dashboard')">
        <span class="logo-text">FinFit</span>
      </button>
      <button class="btn-back" @click="router.go(-1)">← 뒤로</button>
    </header>

    <div class="mp-body">
      <div class="profile-card">
        <div class="avatar-lg">{{ nickname.charAt(0) }}</div>
        <h2 class="mp-name">{{ nickname }}</h2>
        <p class="mp-email">{{ email }}</p>
        <div class="score-row">
          <span class="score-type">{{ resultType }}</span>
          <span class="score-val">점수 {{ riskScore }}</span>
        </div>
      </div>
      <p class="wip-note">마이페이지 기능은 준비 중입니다.</p>
    </div>
  </div>
</template>

<style scoped>
.mypage-shell { min-height: 100vh; background: #f9fafb; font-family: 'Noto Sans KR', sans-serif; }
.mp-header {
  height: 64px; background: #fff; border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
}
.logo-btn { background: none; border: none; cursor: pointer; }
.logo-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 22px; }
.btn-back { background: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 14px; font-size: 14px; cursor: pointer; }
.btn-back:hover { border-color: #1b78fd; }

.mp-body { max-width: 480px; margin: 60px auto; text-align: center; }
.profile-card {
  background: #fff; border-radius: 16px; padding: 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 24px;
}
.avatar-lg {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff; font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
}
.mp-name { font-weight: 700; font-size: 22px; margin-bottom: 4px; }
.mp-email { font-size: 14px; color: #9ca3af; margin-bottom: 16px; }
.score-row { display: flex; justify-content: center; gap: 12px; }
.score-type { background: rgba(27,120,253,0.1); color: #1b78fd; border-radius: 8px; padding: 4px 12px; font-size: 13px; font-weight: 700; }
.score-val { background: #f3f4f6; border-radius: 8px; padding: 4px 12px; font-size: 13px; }
.wip-note { color: #9ca3af; font-size: 14px; }
</style>
