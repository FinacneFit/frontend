<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useFollowStore } from '@/stores/followStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import UserAvatar from '@/components/UserAvatar.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import logoImg from '@/assets/logo.png'

const router          = useRouter()
const authStore       = useAuthStore()
const surveyStore     = useSurveyStore()
const followStore     = useFollowStore()
const portfolioStore  = usePortfolioStore()

// ── 유저 기본 정보 ──
const nickname    = computed(() => authStore.user?.nickname ?? '사용자')
const resultType  = computed(() => authStore.user?.investment_type || surveyStore.resultType || '미설정')
const riskScore   = computed(() => authStore.user?.risk_score  || surveyStore.riskScore  || 0)
const initial     = computed(() => nickname.value.charAt(0))

// 점수 15~120 → 0~100% 변환
const scoreBarWidth = computed(() => {
  const pct = Math.round(((riskScore.value - 15) / 105) * 100)
  return `${Math.min(Math.max(pct, 0), 100)}%`
})

// ── 한 줄 소개 ──
const bio     = computed(() => authStore.user?.bio ?? '')
const editMode  = ref(false)
const editText  = ref('')
const BIO_MAX   = 100

function startEdit() {
  editText.value = bio.value
  editMode.value = true
}
function cancelEdit() { editMode.value = false }
function saveBio() {
  if (editText.value.length > BIO_MAX) return
  authStore.updateBio(editText.value.trim())
  editMode.value = false
}

// ── 팔로워 / 팔로잉 ──
const activeTab     = ref('followers') // 'followers' | 'following'
const tabSectionRef = ref(null)

const followerUsers  = computed(() => followStore.followers)
const followingUsers = computed(() => followStore.following)

// ── 포트폴리오 요약 ──
const holdingsStats = computed(() => portfolioStore.holdingsWithStats)
const totalInvested = computed(() => portfolioStore.totalInvested)
const totalValue    = computed(() => portfolioStore.totalValue)
const returnRate    = computed(() => portfolioStore.returnRate)

const MAX_BARS = 4
const portfolioItems = computed(() => {
  const sorted = [...holdingsStats.value].sort((a, b) => b.proportion - a.proportion)
  if (sorted.length <= MAX_BARS) return sorted
  const top  = sorted.slice(0, MAX_BARS)
  const rest = sorted.slice(MAX_BARS)
  const otherPct = rest.reduce((s, h) => s + h.proportion, 0)
  return [...top, { id: '__etc__', name: '기타', proportion: otherPct, returnRate: null }]
})

function fmt(n)     { return Number(n).toLocaleString() }
function fmtRate(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

function scrollToTab(tab) {
  activeTab.value = tab
  nextTick(() => {
    tabSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ── 내가 쓴 글 ──
const myPostCount = computed(() => authStore.user?.post_count ?? 0)

// ── UserProfileModal ──
const selectedUserId = ref(null)
function openProfile(userId) { selectedUserId.value = userId }
function closeProfile()      { selectedUserId.value = null  }

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.refreshMe()
  followStore.loadFollowers()
  followStore.loadFollowing()
  portfolioStore.loadPortfolio()
})
</script>

<template>
  <div class="mp-shell">
    <!-- ── 헤더 ── -->
    <header class="mp-header">
      <div class="header-left">
        <button class="logo-btn" @click="router.push('/dashboard')">
          <img :src="logoImg" class="logo-img" alt="FinFit" />
          <span class="logo-text">FinFit</span>
        </button>
        <span class="page-title">마이페이지</span>
      </div>
      <div class="header-right">
        <button class="btn-home" @click="router.push('/dashboard')">🏠 홈으로</button>
        <button class="btn-logout" @click="logout">로그아웃</button>
        <div class="user-chip">
          <div class="user-text">
            <span class="user-name"><span class="blue">{{ nickname }}</span> 님</span>
            <span class="user-type">{{ resultType }}</span>
          </div>
          <UserAvatar :nickname="nickname" size="md" />
        </div>
      </div>
    </header>

    <!-- ── 바디 ── -->
    <div class="mp-body">
      <!-- ① 프로필 카드 -->
      <section class="profile-card">
        <!-- 배너 -->
        <div class="banner" />

        <!-- 아바타 + 닉네임 -->
        <div class="avatar-row">
          <UserAvatar :nickname="nickname" size="xl" class="profile-avatar" />
          <span class="profile-nickname">{{ nickname }}</span>
        </div>

        <!-- 팔로워/팔로잉 카운트 -->
        <div class="follow-counts">
          <button class="count-btn" :class="{ active: activeTab === 'followers' }" @click="scrollToTab('followers')">
            <strong>{{ followStore.followerCount }}</strong>팔로워
          </button>
          <span class="count-divider">·</span>
          <button class="count-btn" :class="{ active: activeTab === 'following' }" @click="scrollToTab('following')">
            <strong>{{ followStore.followingCount }}</strong>팔로잉
          </button>
          <span class="count-divider">·</span>
          <span class="count-text"><strong>{{ myPostCount }}</strong>게시글</span>
        </div>

        <!-- 한 줄 소개 -->
        <div class="bio-section">
          <template v-if="!editMode">
            <p class="bio-text">{{ bio || '한 줄 소개를 작성해보세요.' }}</p>
            <button class="btn-edit-bio" @click="startEdit">수정</button>
          </template>
          <template v-else>
            <div class="bio-edit-wrap">
              <textarea
                v-model="editText"
                class="bio-textarea"
                :maxlength="BIO_MAX"
                placeholder="한 줄 소개를 입력하세요 (최대 100자)"
                rows="2"
              />
              <div class="bio-edit-footer">
                <span class="bio-counter" :class="{ warn: editText.length > BIO_MAX - 10 }">
                  {{ editText.length }} / {{ BIO_MAX }}
                </span>
                <div class="bio-edit-actions">
                  <button class="btn-cancel" @click="cancelEdit">취소</button>
                  <button class="btn-save" :disabled="editText.length > BIO_MAX" @click="saveBio">저장</button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ② 투자 성향 -->
      <section class="info-section">
        <h3 class="section-heading">투자 성향</h3>
        <div class="tendency-row">
          <div class="tendency-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#grad)" />
              <circle cx="14" cy="14" r="6" stroke="#fff" stroke-width="2.2" fill="none" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stop-color="#1b78fd"/>
                  <stop offset="100%" stop-color="#2adbc6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="tendency-info">
            <div class="tendency-title-row">
              <span class="tendency-type">{{ resultType }}</span>
              <span class="score-badge">{{ riskScore }}점</span>
            </div>
            <p class="tendency-desc">
              <template v-if="resultType === '안전추구형'">안정성을 최우선으로 여기며 원금 보전에 집중합니다.</template>
              <template v-else-if="resultType === '공격투자형'">높은 수익을 위해 적극적인 위험 감수를 선호합니다.</template>
              <template v-else>균형 잡힌 투자로 리스크와 수익을 조율합니다.</template>
            </p>
          </div>
        </div>
        <!-- 프로그레스 바 -->
        <div class="score-bar-wrap">
          <div class="score-bar-track">
            <div class="score-bar-fill" :style="{ width: scoreBarWidth }" />
          </div>
          <div class="score-bar-labels">
            <span>안전</span><span>중립</span><span>공격</span>
          </div>
        </div>
      </section>

      <!-- ③ 포트폴리오 요약 -->
      <section class="info-section">
        <h3 class="section-heading">포트폴리오 요약</h3>
        <div class="portfolio-stats">
          <div class="pstat">
            <p class="pstat-label">총 투자금</p>
            <p class="pstat-val">{{ fmt(totalInvested) }}원</p>
          </div>
          <div class="pstat">
            <p class="pstat-label">평가 금액</p>
            <p class="pstat-val">{{ fmt(totalValue) }}원</p>
          </div>
          <div class="pstat">
            <p class="pstat-label">수익률</p>
            <p class="pstat-val" :class="returnRate >= 0 ? 'pos' : 'neg'">{{ fmtRate(returnRate) }}</p>
          </div>
        </div>
        <div v-if="portfolioItems.length" class="portfolio-stocks">
          <div v-for="(h, i) in portfolioItems" :key="h.id" class="pstock-row">
            <span class="pstock-name">{{ h.name }}</span>
            <div class="pstock-bar-track">
              <div
                class="pstock-bar-fill"
                :style="{
                  width: `${Math.round(h.proportion)}%`,
                  background: h.id === '__etc__'
                    ? '#9ca3af'
                    : ['#1b78fd','#2adbc6','#8b5cf6'][i % 3]
                }"
              />
            </div>
            <span class="pstock-pct">{{ Math.round(h.proportion) }}%</span>
            <span
              v-if="h.returnRate !== null"
              class="pstock-rate"
              :class="h.returnRate >= 0 ? 'pos' : 'neg'"
            >{{ fmtRate(h.returnRate) }}</span>
            <span v-else class="pstock-rate" style="color:#9ca3af">-</span>
          </div>
        </div>
        <p v-else class="empty-hint">보유 종목이 없습니다.</p>
      </section>

      <!-- ④ 팔로워 / 팔로잉 탭 -->
      <section ref="tabSectionRef" class="info-section">
        <div class="tab-header">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'followers' }"
            @click="activeTab = 'followers'"
          >팔로워 {{ followStore.followerCount }}</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'following' }"
            @click="activeTab = 'following'"
          >팔로잉 {{ followStore.followingCount }}</button>
        </div>

        <!-- 팔로워 목록 -->
        <div v-if="activeTab === 'followers'" class="user-list">
          <div
            v-for="user in followerUsers"
            :key="user.id"
            class="user-card"
            @click="openProfile(user.id)"
          >
            <UserAvatar :nickname="user.nickname" size="md" />
            <div class="user-card-info">
              <p class="user-card-name">{{ user.nickname }}</p>
              <p class="user-card-sub">{{ user.investmentType }}</p>
            </div>
            <button
              class="follow-btn"
              :class="{ following: followStore.isFollowing(user.id) }"
              @click.stop="followStore.toggleFollow(user.id)"
            >
              {{ followStore.isFollowing(user.id) ? '팔로잉' : '팔로우' }}
            </button>
          </div>
          <p v-if="!followerUsers.length" class="empty-hint">팔로워가 없습니다.</p>
        </div>

        <!-- 팔로잉 목록 -->
        <div v-else class="user-list">
          <div
            v-for="user in followingUsers"
            :key="user.id"
            class="user-card"
            @click="openProfile(user.id)"
          >
            <UserAvatar :nickname="user.nickname" size="md" />
            <div class="user-card-info">
              <p class="user-card-name">{{ user.nickname }}</p>
              <p class="user-card-sub">{{ user.investmentType }}</p>
            </div>
            <button
              class="follow-btn following"
              @click.stop="followStore.unfollow(user.id)"
            >팔로잉</button>
          </div>
          <p v-if="!followingUsers.length" class="empty-hint">팔로잉하는 사용자가 없습니다.</p>
        </div>
      </section>
    </div><!-- /mp-body -->

    <!-- UserProfileModal -->
    <UserProfileModal
      v-if="selectedUserId !== null"
      :userId="selectedUserId"
      @close="closeProfile"
    />
  </div>
</template>

<style scoped>
/* ── 셸 ── */
.mp-shell {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Noto Sans KR', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ── 헤더 ── */
.mp-header {
  height: 68px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left  { display: flex; align-items: center; gap: 14px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.logo-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 8px; }
.logo-img { width: 36px; height: 36px; object-fit: contain; }
.logo-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 22px; color: #000; }
.page-title { font-weight: 700; font-size: 18px; color: #111827; }

.btn-home {
  border: 1px solid #e5e7eb; border-radius: 14px; padding: 7px 16px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; cursor: pointer;
}
.btn-home:hover { border-color: #1b78fd; }
.btn-logout {
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px 13px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #787878; cursor: pointer;
}
.user-chip { display: flex; align-items: center; gap: 8px; }
.user-text { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-weight: 700; font-size: 14px; }
.blue { color: #1b78fd; }
.user-type { font-size: 11px; color: #787878; }

/* ── 바디 ── */
.mp-body {
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 프로필 카드 ── */
.profile-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.banner {
  height: 100px;
  background: linear-gradient(135deg, #1b78fd 0%, #2adbc6 100%);
}
.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 24px;
  margin-top: -30px;
}
.profile-avatar {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.profile-nickname {
  font-weight: 800;
  font-size: 20px;
  color: #111827;
  margin-top: 8px;
}
.follow-counts {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #6b7280;
}
.count-btn {
  background: none;
  border: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.count-btn:hover, .count-btn.active { color: #1b78fd; background: rgba(27,120,253,0.08); }
.count-btn strong { color: #111827; font-weight: 800; margin-right: 2px; }
.count-divider { color: #d1d5db; }
.count-text strong { color: #111827; font-weight: 800; margin-right: 2px; }

/* ── 한 줄 소개 ── */
.bio-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px 20px;
}
.bio-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  word-break: keep-all;
  margin: 0;
  min-height: 24px;
}
.btn-edit-bio {
  flex-shrink: 0;
  background: none;
  border: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #1b78fd;
  cursor: pointer;
  padding: 2px 4px;
}
.btn-edit-bio:hover { text-decoration: underline; }
.bio-edit-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bio-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #374151;
  resize: none;
  outline: none;
  transition: border-color 0.15s;
  line-height: 1.6;
}
.bio-textarea:focus { border-color: #1b78fd; }
.bio-edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bio-counter { font-size: 12px; color: #9ca3af; }
.bio-counter.warn { color: #ef4444; }
.bio-edit-actions { display: flex; gap: 8px; }
.btn-cancel {
  height: 34px; padding: 0 16px; border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; cursor: pointer;
}
.btn-cancel:hover { border-color: #9ca3af; }
.btn-save {
  height: 34px; padding: 0 16px; background: #1b78fd; color: #fff; border: none;
  border-radius: 8px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer;
}
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-save:not(:disabled):hover { opacity: 0.88; }

/* ── 공통 섹션 ── */
.info-section {
  background: #fff;
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.section-heading {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
  margin: 0 0 16px;
}

/* ── 투자 성향 ── */
.tendency-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
.tendency-icon { flex-shrink: 0; }
.tendency-info { flex: 1; }
.tendency-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.tendency-type { font-weight: 700; font-size: 16px; color: #111827; }
.score-badge {
  background: #1b78fd; color: #fff;
  border-radius: 9999px; padding: 2px 10px;
  font-size: 12px; font-weight: 700; font-family: 'Inter', sans-serif;
}
.tendency-desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0; }
.score-bar-wrap { }
.score-bar-track {
  height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; margin-bottom: 6px;
}
.score-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #2adbc6, #1b78fd);
  border-radius: 9999px;
  transition: width 0.4s ease;
}
.score-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #9ca3af;
}

/* ── 포트폴리오 요약 ── */
.portfolio-stats { display: flex; gap: 12px; margin-bottom: 16px; }
.pstat {
  flex: 1; text-align: center;
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 8px;
}
.pstat-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
.pstat-val { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 15px; color: #111827; }
.portfolio-stocks { display: flex; flex-direction: column; gap: 10px; }
.pstock-row { display: flex; align-items: center; gap: 10px; }
.pstock-name { font-size: 13px; font-weight: 600; width: 72px; flex-shrink: 0; color: #374151; }
.pstock-bar-track { flex: 1; height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; }
.pstock-bar-fill { height: 100%; border-radius: 9999px; }
.pstock-pct { font-size: 12px; color: #6b7280; width: 36px; text-align: right; flex-shrink: 0; }
.pstock-rate { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; width: 60px; text-align: right; flex-shrink: 0; }

/* ── 팔로워/팔로잉 탭 ── */
.tab-header {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #f3f4f6;
  margin-bottom: 16px;
}
.tab-btn {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active { color: #1b78fd; border-bottom-color: #1b78fd; }
.tab-btn:not(.active):hover { color: #374151; }

/* ── 사용자 카드 ── */
.user-list { display: flex; flex-direction: column; gap: 10px; }
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.1s;
}
.user-card:hover { background: #fafafa; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.user-card-info { flex: 1; min-width: 0; }
.user-card-name { font-weight: 700; font-size: 14px; color: #111827; }
.user-card-sub  { font-size: 12px; color: #9ca3af; margin-top: 2px; }

.follow-btn {
  flex-shrink: 0;
  height: 34px;
  padding: 0 18px;
  border-radius: 9999px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid #1b78fd;
  background: #fff;
  color: #1b78fd;
}
.follow-btn:hover:not(.following) { background: #1b78fd; color: #fff; }
.follow-btn.following {
  border-color: #e5e7eb;
  background: #f9fafb;
  color: #9ca3af;
}
.follow-btn.following:hover { border-color: #ef4444; color: #ef4444; }

/* ── 공통 ── */
.pos { color: #ef4444; }
.neg { color: #3b82f6; }
.empty-hint { font-size: 13px; color: #9ca3af; text-align: center; padding: 20px 0; }
</style>
