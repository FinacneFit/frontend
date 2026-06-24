<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useCommunityStore } from '@/stores/communityStore'
import logoImg from '@/assets/logo.png'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const route  = useRoute()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()
const communityStore = useCommunityStore()

const RISK_TYPES = ['안정형', '안정추구형', '위험중립형', '적극투자형', '공격투자형']

const nickname   = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type || surveyStore.resultType || '')
const initial    = computed(() => nickname.value.charAt(0))

function logout() { authStore.logout(); router.push('/login') }

function clearFilter() {
  communityStore.activeFilter = null
  if (route.path !== '/community') router.push('/community')
}

function handleFilter(type) {
  communityStore.setFilter(type)
  if (route.path !== '/community') router.push('/community')
}
</script>

<template>
  <div class="comm-shell">
    <!-- 헤더 -->
    <app-header />

    <!-- 바디 (메인 페이지와 동일한 max-width) -->
    <div class="comm-body-outer">
      <div class="comm-body">
        <!-- 사이드바 -->
        <aside class="comm-sidebar">
          <div class="sidebar-top">
            <p class="filter-title">성향 필터</p>
            <div class="filter-list">
              <!-- 전체 보기 -->
              <button
                class="filter-btn all-btn"
                :class="{ active: !communityStore.activeFilter }"
                @click="clearFilter"
              >
                전체
              </button>
              <!-- 5개 성향 -->
              <button
                v-for="type in RISK_TYPES"
                :key="type"
                class="filter-btn"
                :class="{
                  active: communityStore.activeFilter === type,
                  mine: resultType === type && communityStore.activeFilter !== type,
                }"
                @click="handleFilter(type)"
              >
                {{ type }}
                <span v-if="resultType === type" class="my-badge">내 성향</span>
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

/* ── 헤더 ── */
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
  border: 1px solid #e5e7eb; border-radius: 14px; padding: 9px 17px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.btn-home:hover { border-color: #1b78fd; }
.btn-logout {
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px 13px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #787878; cursor: pointer;
}
.user-info { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; }
.user-text { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-weight: 700; font-size: 14px; }
.name-blue { color: #1b78fd; }
.user-type { font-size: 11px; color: #787878; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff; font-weight: 700; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
}

/* ── 바디 outer: 메인 페이지와 동일한 max-width ── */
.comm-body-outer {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.comm-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
}

/* ── 사이드바 ── */
.comm-sidebar {
  width: 250px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  flex-shrink: 0;
}
.filter-title { font-weight: 700; font-size: 15px; color: #374151; margin-bottom: 10px; }
.filter-list { display: flex; flex-direction: column; gap: 6px; }

.filter-btn {
  width: 100%; height: 44px;
  border: none; border-radius: 12px;
  background: rgba(27, 120, 253, 0.08);
  font-family: 'Noto Sans KR', sans-serif; font-weight: 600; font-size: 14px; color: #374151;
  text-align: left; padding: 0 14px;
  cursor: pointer; transition: background 0.15s, color 0.15s;
  display: flex; align-items: center; justify-content: space-between;
}
.all-btn { background: #f3f4f6; }
.filter-btn.active { background: #1b78fd; color: #fff; }
.filter-btn.mine { border: 1.5px solid #1b78fd; }
.filter-btn:hover:not(.active) { background: rgba(27, 120, 253, 0.18); }

.my-badge {
  font-size: 10px; font-weight: 700; color: #1b78fd;
  background: #e8f0fe; border-radius: 20px; padding: 2px 7px;
}
.filter-btn.active .my-badge { color: #fff; background: rgba(255,255,255,0.25); }

.sidebar-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
.btn-write {
  flex: 1; height: 44px; background: #1b78fd; color: #fff; border: none;
  border-radius: 14px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-write:hover { opacity: 0.88; }
.btn-my {
  flex: 1; height: 44px; background: #fff; border: 1px solid #a9a9a9;
  border-radius: 14px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-my:hover { border-color: #1b78fd; }

/* ── 콘텐츠 ── */
.comm-content { flex: 1; overflow-y: auto; min-width: 0; }
</style>
