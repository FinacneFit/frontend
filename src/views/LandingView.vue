<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const LOGO_URL = 'https://www.figma.com/api/mcp/asset/44288242-e650-499a-949c-62d53645aa10'
</script>

<template>
  <div class="landing-bg">
    <div class="landing-content">
      <div class="landing-left">
        <div class="logo-row">
          <div class="logo-icon-box">
            <img :src="LOGO_URL" alt="FinFit 로고" class="logo-icon" />
          </div>
          <span class="logo-text">FinFit</span>
        </div>
        <div class="headline">
          <p>직접 만드는</p>
          <p>나만의 금융 포트폴리오</p>
        </div>
        <p class="sub-text">AI 추천부터 커뮤니티까지, 투자의 모든 것</p>
      </div>

      <div class="landing-right">
        <button class="btn-signup" @click="router.push('/signup')">회원가입</button>
        <button class="btn-login" @click="router.push('/login')">로그인</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-bg {
  min-height: 100vh;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.landing-content {
  max-width: 1024px;
  width: 100%;
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon-box {
  background: white;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0px 4px 3px rgba(0, 0, 0, 0.1), 0px 2px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 60px;
  color: white;
  line-height: 60px;
  letter-spacing: -1.5px;
}

.headline {
  margin-top: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 30px;
  color: white;
  line-height: 1.625;
}

.sub-text {
  margin-top: 16px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 24px;
}

.landing-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-signup,
.btn-login {
  width: 320px;
  padding: 16px;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 28px;
  text-align: center;
  cursor: pointer;
  border: none;
  box-shadow: 0px 10px 7.5px rgba(0, 0, 0, 0.1), 0px 4px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.15s;
}

.btn-signup:hover,
.btn-login:hover {
  opacity: 0.88;
}

.btn-signup {
  background: #1b78fd;
  color: white;
}

.btn-login {
  background: white;
  color: #000;
}
</style>
