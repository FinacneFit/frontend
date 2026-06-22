<template>
  <header class="app-header">
    <div class="header-left">
      <button class="logo-btn" @click="router.push('/dashboard')">
        <img :src="logoImg" class="logo-img" alt="FinFit" />
        <span class="logo-text">FinFit</span>
      </button>
    </div>

    <div class="header-right">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="btn-nav"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        {{ item.label }}
      </button>

      <button class="btn-logout" @click="logout">
        로그아웃
      </button>

      <button class="user-info" @click="router.push('/mypage')">
        <div class="user-text">
          <span class="user-name">
            <span class="name-blue">{{ nickname }}</span> 님
          </span>
          <span class="user-type">{{ resultType }}</span>
        </div>

        <div class="avatar">
          {{ initial }}
        </div>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type ?? '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

const navItems = [
  {
    label: '예금·적금',
    path: '/deposits',
  },
  {
    label: '현물 차트',
    path: '/spot-assets',
  },
  {
    label: '주식 정보',
    path: '/stock-videos',
  },
  {
    label: '은행 찾기',
    path: '/banks',
  },
  {
    label: '커뮤니티',
    path: '/community',
  },
]

function isActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  height: 68px;
  border-bottom: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #000;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-nav {
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 8px 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-nav:hover {
  opacity: 0.88;
}

.btn-nav.active {
  background: #0f5ed7;
  box-shadow: 0 6px 14px rgba(27, 120, 253, 0.25);
}

.btn-logout {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 13px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #787878;
  cursor: pointer;
  white-space: nowrap;
}

.btn-logout:hover {
  border-color: #cbd5e1;
  color: #374151;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
}

.name-blue {
  color: #1b78fd;
}

.user-type {
  font-size: 11px;
  color: #787878;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .app-header {
    height: auto;
    min-height: 68px;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .header-right {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .btn-nav,
  .btn-logout,
  .user-info {
    flex-shrink: 0;
  }
}
</style>