<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useCommunityStore } from '@/stores/communityStore'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()
const communityStore = useCommunityStore()

const RISK_TYPES = ['안전추구형', '공격투자형', '위험중립형']

const nickname = authStore.user?.nickname ?? '사용자'
const resultType = surveyStore.resultType ?? '안정추구형'
const initial = nickname.charAt(0)

function logout() { authStore.logout(); router.push('/login') }
</script>

<template>
  <div class="comm-shell">
    <!-- 헤더 -->
    <header class="comm-header">
      <div class="header-left">
        <button class="logo-btn" @click="router.push('/dashboard')">
          <img :src="logoImg" class="logo-img" alt="FinFit" />
          <span class="logo-text">FinFit</span>
        </button>
        <span class="comm-label">커뮤니티</span>
      </div>
      <div class="header-right">
        <button class="btn-home" @click="router.push('/dashboard')">🏠 홈으로</button>
        <button class="btn-logout" @click="logout">로그아웃</button>
        <button class="user-info" @click="router.push('/mypage')">
          <div class="user-text">
            <span class="user-name"><span class="name-blue">{{ nickname }}</span> 님</span>
            <span class="user-type">{{ resultType }}</span>
          </div>
          <div class="avatar">{{ initial }}</div>
        </button>
      </div>
    </header>

    <!-- 바디 -->
    <div class="comm-body">
      <!-- 사이드바 -->
      <aside class="comm-sidebar">
        <div class="sidebar-top">
          <p class="filter-title">필터</p>
          <div class="filter-list">
            <button
              v-for="type in RISK_TYPES"
              :key="type"
              class="filter-btn"
              :class="{ active: communityStore.activeFilter === type }"
              @click="communityStore.setFilter(type)"
            >
              {{ type }}
            </button>
          </div>
        </div>
        <div class="sidebar-actions">
          <button class="btn-write" @click="router.push('/community/create')">글쓰기</button>
          <button class="btn-my" @click="router.push('/community/my')">내가 쓴 글</button>
        </div>
      </aside>

      <!-- 콘텐츠 -->
      <main class="comm-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.comm-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 헤더 */
.comm-header {
  height: 68px;
  border-bottom: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  background: #fff;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.logo-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 8px; }
.logo-img { width: 36px; height: 36px; object-fit: contain; }
.logo-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; color: #000; }
.comm-label { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 18px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.btn-home {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 9px 17px;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-home:hover { border-color: #1b78fd; }
.btn-logout {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 13px;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #787878;
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.user-text { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-weight: 700; font-size: 14px; }
.name-blue { color: #1b78fd; }
.user-type { font-size: 11px; color: #787878; }
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

/* 바디 */
.comm-body { display: flex; flex: 1; overflow: hidden; }

/* 사이드바 */
.comm-sidebar {
  width: 280px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  flex-shrink: 0;
}
.filter-title { font-weight: 700; font-size: 16px; margin-bottom: 12px; }
.filter-list { display: flex; flex-direction: column; gap: 8px; }
.filter-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: rgba(27, 120, 253, 0.1);
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #000;
  text-align: left;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.filter-btn.active { background: #1b78fd; color: #fff; }
.filter-btn:hover:not(.active) { background: rgba(27, 120, 253, 0.2); }
.sidebar-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
.btn-write {
  flex: 1;
  height: 44px;
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.btn-write:hover { opacity: 0.88; }
.btn-my {
  flex: 1;
  height: 44px;
  background: #fff;
  border: 1px solid #a9a9a9;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.btn-my:hover { border-color: #1b78fd; }

/* 콘텐츠 */
.comm-content { flex: 1; overflow-y: auto; }
</style>
