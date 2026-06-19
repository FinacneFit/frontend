<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthSurveyLayout from '@/layouts/AuthSurveyLayout.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const isLoading = ref(false)

function validate() {
  let valid = true

  if (!form.email.trim()) {
    errors.email = '이메일을 입력해주세요.'
    valid = false
  } else {
    errors.email = ''
  }

  if (!form.password) {
    errors.password = '비밀번호를 입력해주세요.'
    valid = false
  } else {
    errors.password = ''
  }

  return valid
}

async function handleSubmit() {
  errors.general = ''
  if (!validate()) return
  isLoading.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })
    router.push('/dashboard')
  } catch (err) {
    errors.general = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthSurveyLayout>
    <div class="card-header">
      <h1 class="brand-title">FinFit</h1>
      <p class="welcome-text">에 다시 오신 것을 환영합니다 !</p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
      <!-- 이메일 -->
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input
          v-model="form.email"
          type="email"
          class="form-input"
          :class="{ 'input-error': errors.email }"
          placeholder="example@email.com"
          autocomplete="email"
        />
        <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
      </div>

      <!-- 비밀번호 -->
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input
          v-model="form.password"
          type="password"
          class="form-input"
          :class="{ 'input-error': errors.password }"
          autocomplete="current-password"
        />
        <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
        <p v-else class="hint-text">영어, 숫자를 포함하여 8자 이상으로 입력해주세요.</p>
      </div>

      <!-- 전체 에러 -->
      <p v-if="errors.general" class="error-text general-error">{{ errors.general }}</p>

      <!-- 로그인 버튼 -->
      <button type="submit" class="btn-submit" :disabled="isLoading">
        {{ isLoading ? '처리 중...' : '로그인' }}
      </button>
    </form>

    <!-- 회원가입 링크 -->
    <div class="footer-link">
      <span class="footer-text">아직 계정이 없으신가요? </span>
      <button type="button" class="link-btn" @click="router.push('/signup')">회원가입</button>
    </div>
  </AuthSurveyLayout>
</template>

<style scoped>
.card-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  text-align: center;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  color: #000;
  text-align: center;
  margin-top: 8px;
}

.auth-form {
  width: 100%;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  color: #000;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 42px;
  border: 1px solid #878787;
  border-radius: 14px;
  padding: 11px 17px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #0a0a0a;
  outline: none;
  background: transparent;
  transition: border-color 0.15s;
}

.form-input::placeholder {
  color: rgba(10, 10, 10, 0.5);
}

.form-input:focus {
  border-color: #1b78fd;
}

.form-input.input-error {
  border-color: #ff6467;
}

.error-text {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #fb2c36;
  margin-top: 4px;
}

.hint-text {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #6d6d6d;
  margin-top: 4px;
}

.general-error {
  margin-top: 0;
  text-align: center;
}

.btn-submit {
  width: 100%;
  height: 48px;
  background: #1b78fd;
  border: none;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: white;
  text-align: center;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.15s;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-link {
  width: 100%;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-text {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #787878;
}

.link-btn {
  background: none;
  border: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: #1b78fd;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
}

.link-btn:hover {
  opacity: 0.75;
}
</style>
