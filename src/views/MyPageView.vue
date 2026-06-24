<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useFollowStore } from '@/stores/followStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useDepositStore } from '@/stores/depositStore'
import UserAvatar from '@/components/UserAvatar.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import logoImg from '@/assets/logo.png'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()
const followStore = useFollowStore()
const portfolioStore = usePortfolioStore()
const depositStore = useDepositStore()

// ── 유저 기본 정보 ──
const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type || surveyStore.resultType || '미설정')
const riskScore = computed(() => authStore.user?.risk_score || surveyStore.riskScore || 0)
const initial = computed(() => nickname.value.charAt(0))

const scoreBarWidth = computed(() => {
  const pct = Math.round(((riskScore.value - 15) / 105) * 100)
  return `${Math.min(Math.max(pct, 0), 100)}%`
})

// ── 한 줄 소개 ──
const bio = computed(() => authStore.user?.bio ?? '')
const editMode = ref(false)
const editText = ref('')
const BIO_MAX = 100

function startEdit() {
  editText.value = bio.value
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

function saveBio() {
  if (editText.value.length > BIO_MAX) return

  authStore.updateBio(editText.value.trim())
  editMode.value = false
}

// ── 팔로워 / 팔로잉 ──
const activeTab = ref('followers')
const tabSectionRef = ref(null)

const followerUsers = computed(() => followStore.followers)
const followingUsers = computed(() => followStore.following)

// ── 주식 포트폴리오 요약 ──
const holdingsStats = computed(() => portfolioStore.holdingsWithStats)
const totalInvested = computed(() => portfolioStore.totalInvested)
const totalValue = computed(() => portfolioStore.totalValue)
const returnRate = computed(() => portfolioStore.returnRate)

const MAX_BARS = 4
const portfolioTab = ref('stocks')
const removingDepositId = ref(null)

const portfolioItems = computed(() => {
  const sorted = [...holdingsStats.value].sort((a, b) => b.proportion - a.proportion)

  if (sorted.length <= MAX_BARS) return sorted

  const top = sorted.slice(0, MAX_BARS)
  const rest = sorted.slice(MAX_BARS)
  const otherPct = rest.reduce((sum, holding) => sum + holding.proportion, 0)

  return [
    ...top,
    {
      id: '__etc__',
      name: '기타',
      proportion: otherPct,
      returnRate: null,
    },
  ]
})

// ── 예금·적금 포트폴리오 요약 ──
const savedDepositItems = computed(() => depositStore.savedDeposits ?? [])

const depositTotalAmount = computed(() => {
  return savedDepositItems.value.reduce((sum, item) => {
    return sum + Number(item.amount || 0)
  }, 0)
})

const depositExpectedInterest = computed(() => {
  return savedDepositItems.value.reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    const rate = Number(item.final_rate || 0)

    return sum + Math.floor(amount * (rate / 100))
  }, 0)
})

const depositAverageRate = computed(() => {
  const total = depositTotalAmount.value

  if (total <= 0) return 0

  const weightedRateSum = savedDepositItems.value.reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    const rate = Number(item.final_rate || 0)

    return sum + amount * rate
  }, 0)

  return weightedRateSum / total
})

const depositPortfolioItems = computed(() => {
  const total = depositTotalAmount.value

  const mapped = savedDepositItems.value.map((item) => {
    const amount = Number(item.amount || 0)
    const product = item.product ?? {}

    return {
      id: item.id,
      productId: product.id,
      name: product.productName ?? '상품명 없음',
      bankName: product.bankName ?? '',
      productType: product.productType ?? 'deposit',
      amount,
      finalRate: Number(item.final_rate || product.maxRate || 0),
      proportion: total > 0 ? (amount / total) * 100 : 0,
    }
  })

  const sorted = mapped.sort((a, b) => b.proportion - a.proportion)

  if (sorted.length <= MAX_BARS) return sorted

  const top = sorted.slice(0, MAX_BARS)
  const rest = sorted.slice(MAX_BARS)

  const otherAmount = rest.reduce((sum, item) => sum + item.amount, 0)
  const otherPct = rest.reduce((sum, item) => sum + item.proportion, 0)

  return [
    ...top,
    {
      id: '__deposit_etc__',
      name: '기타',
      bankName: '',
      productType: 'etc',
      amount: otherAmount,
      finalRate: null,
      proportion: otherPct,
    },
  ]
})

function fmt(value) {
  return Number(value || 0).toLocaleString()
}

function fmtRate(value) {
  return `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`
}

function fmtDepositRate(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function productTypeLabel(type) {
  if (type === 'saving') return '적금'
  if (type === 'deposit') return '예금'
  return ''
}

async function removeSavedDeposit(productId) {
  if (!productId) return

  removingDepositId.value = productId

  try {
    await depositStore.deleteSavedProduct(productId)
  } finally {
    removingDepositId.value = null
  }
}

function scrollToTab(tab) {
  activeTab.value = tab
  nextTick(() => {
    tabSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ── 통합 자산 ──
const totalAsset = computed(() => totalValue.value + depositTotalAmount.value)
const totalStockProfit = computed(() => totalValue.value - totalInvested.value)
const totalProfit = computed(() => totalStockProfit.value + depositExpectedInterest.value)

// ── 내가 쓴 글 ──
const myPostCount = computed(() => authStore.user?.post_count ?? 0)

function goToMyPosts() {
  router.push('/community/my')
}

// ── UserProfileModal ──
const selectedUserId = ref(null)

function openProfile(userId) {
  selectedUserId.value = userId
}

function closeProfile() {
  selectedUserId.value = null
}

const showRetestModal = ref(false)

watch(showRetestModal, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

const canRetakeSurvey = computed(() => {
  const lastDate = authStore.user?.last_survey_date
  if (!lastDate) return true
  const next = new Date(lastDate)
  next.setDate(next.getDate() + 30)
  return new Date() >= next
})

const nextSurveyDate = computed(() => {
  const lastDate = authStore.user?.last_survey_date
  if (!lastDate) return ''
  const next = new Date(lastDate)
  next.setDate(next.getDate() + 30)
  return `${next.getFullYear()}년 ${next.getMonth() + 1}월 ${next.getDate()}일`
})

function goToResurvey() {
  surveyStore.reset()
  router.push('/survey/intro')
}

function confirmRetest() {
  showRetestModal.value = false
  goToResurvey()
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.refreshMe()
  followStore.loadFollowers()
  followStore.loadFollowing()
  portfolioStore.loadPortfolio()
  depositStore.loadSavedProducts()
})
</script>

<template>
  <div class="mp-shell">
    <AppHeader />

    <div class="mp-body">
      <!-- ① 프로필 카드 -->
      <section class="profile-card">
        <div class="banner" />

        <div class="avatar-row">
          <UserAvatar :nickname="nickname" size="xl" class="profile-avatar" />
          <span class="profile-nickname">{{ nickname }}</span>
        </div>

        <div class="follow-counts">
          <button
            class="count-btn"
            :class="{ active: activeTab === 'followers' }"
            type="button"
            @click="scrollToTab('followers')"
          >
            <strong>{{ followStore.followerCount }}</strong>팔로워
          </button>

          <span class="count-divider">·</span>

          <button
            class="count-btn"
            :class="{ active: activeTab === 'following' }"
            type="button"
            @click="scrollToTab('following')"
          >
            <strong>{{ followStore.followingCount }}</strong>팔로잉
          </button>

          <span class="count-divider">·</span>

          <button
            class="count-btn"
            type="button"
            @click="goToMyPosts"
          >
            <strong>{{ myPostCount }}</strong>게시글
          </button>
        </div>

        <div class="bio-section">
          <template v-if="!editMode">
            <p class="bio-text">{{ bio || '한 줄 소개를 작성해보세요.' }}</p>
            <button class="btn-edit-bio" type="button" @click="startEdit">
              수정
            </button>
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
                <span
                  class="bio-counter"
                  :class="{ warn: editText.length > BIO_MAX - 10 }"
                >
                  {{ editText.length }} / {{ BIO_MAX }}
                </span>

                <div class="bio-edit-actions">
                  <button class="btn-cancel" type="button" @click="cancelEdit">
                    취소
                  </button>

                  <button
                    class="btn-save"
                    type="button"
                    :disabled="editText.length > BIO_MAX"
                    @click="saveBio"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ② 투자 성향 -->
      <section class="info-section">
        <div class="tendency-header">
          <h3 class="section-heading" style="margin:0">투자 성향</h3>
          <button
            class="btn-retest"
            type="button"
            :disabled="!canRetakeSurvey"
            :title="canRetakeSurvey ? '재검사하기' : `${nextSurveyDate}부터 재검사 가능합니다`"
            @click="showRetestModal = true"
          >
            {{ canRetakeSurvey ? '재검사' : '30일 제한' }}
          </button>
        </div>

        <div class="tendency-row">
          <div class="tendency-info">
            <div class="tendency-title-row">
              <span class="tendency-type">{{ resultType }}</span>
              <span class="score-badge">{{ riskScore }}점</span>
            </div>

            <p class="tendency-desc">
              <template v-if="resultType === '안전추구형'">
                안정성을 최우선으로 여기며 원금 보전에 집중합니다.
              </template>
              <template v-else-if="resultType === '공격투자형'">
                높은 수익을 위해 적극적인 위험 감수를 선호합니다.
              </template>
              <template v-else>
                균형 잡힌 투자로 리스크와 수익을 조율합니다.
              </template>
            </p>
          </div>
        </div>

        <div class="score-bar-wrap">
          <div class="score-bar-track">
            <div class="score-bar-fill" :style="{ width: scoreBarWidth }" />
          </div>

          <div class="score-bar-labels">
            <span>안전</span>
            <span>중립</span>
            <span>공격</span>
          </div>
        </div>
      </section>

      <!-- ③ 통합 자산 요약 -->
      <section class="info-section asset-card">
        <div class="asset-header">
          <h3 class="section-heading" style="margin:0">통합 자산</h3>
          <span class="asset-date">기준: 현재가</span>
        </div>

        <div class="asset-total">
          <span class="asset-total-label">총 자산</span>
          <span class="asset-total-value">{{ fmt(totalAsset) }}<em>원</em></span>
          <span class="asset-total-profit" :class="totalProfit >= 0 ? 'pos' : 'neg'">
            {{ totalProfit >= 0 ? '+' : '' }}{{ fmt(totalProfit) }}원
          </span>
        </div>

        <div class="asset-breakdown">
          <div class="asset-item">
            <div class="asset-item-icon stock-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <polyline points="1 13 5 8 9 11 13 5 17 2" stroke="#1b78fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
            <div class="asset-item-info">
              <span class="asset-item-label">주식 평가액</span>
              <span class="asset-item-value">{{ fmt(totalValue) }}원</span>
            </div>
            <span class="asset-item-sub" :class="totalStockProfit >= 0 ? 'pos' : 'neg'">
              {{ totalStockProfit >= 0 ? '+' : '' }}{{ fmt(totalStockProfit) }}원
            </span>
          </div>

          <div class="asset-divider" />

          <div class="asset-item">
            <div class="asset-item-icon deposit-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="5" width="16" height="11" rx="2" stroke="#2adbc6" stroke-width="1.8"/>
                <path d="M5 5V4a4 4 0 0 1 8 0v1" stroke="#2adbc6" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="9" cy="11" r="1.5" fill="#2adbc6"/>
              </svg>
            </div>
            <div class="asset-item-info">
              <span class="asset-item-label">예금·적금</span>
              <span class="asset-item-value">{{ fmt(depositTotalAmount) }}원</span>
            </div>
            <span class="asset-item-sub pos">
              +{{ fmt(depositExpectedInterest) }}원 예상이자
            </span>
          </div>
        </div>
      </section>

      <!-- ④ 포트폴리오 요약 (주식/예금 탭) -->
      <section class="info-section">
        <div class="portfolio-heading-row">
          <h3 class="section-heading portfolio-heading">포트폴리오 요약</h3>

          <div class="portfolio-tabs">
            <button
              class="portfolio-tab"
              :class="{ active: portfolioTab === 'stocks' }"
              type="button"
              @click="portfolioTab = 'stocks'"
            >
              주식
            </button>

            <button
              class="portfolio-tab"
              :class="{ active: portfolioTab === 'deposits' }"
              type="button"
              @click="portfolioTab = 'deposits'"
            >
              예금·적금
            </button>
          </div>
        </div>

        <template v-if="portfolioTab === 'stocks'">
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
              <p class="pstat-val" :class="returnRate >= 0 ? 'pos' : 'neg'">
                {{ fmtRate(returnRate) }}
              </p>
            </div>
          </div>

          <div v-if="portfolioItems.length" class="portfolio-stocks">
            <div
              v-for="(holding, index) in portfolioItems"
              :key="holding.id"
              class="pstock-row"
            >
              <span class="pstock-name">{{ holding.name }}</span>

              <div class="pstock-bar-track">
                <div
                  class="pstock-bar-fill"
                  :style="{
                    width: `${Math.round(holding.proportion)}%`,
                    background: holding.id === '__etc__'
                      ? '#9ca3af'
                      : ['#1b78fd', '#2adbc6', '#8b5cf6'][index % 3]
                  }"
                />
              </div>

              <span class="pstock-pct">
                {{ Math.round(holding.proportion) }}%
              </span>

              <span
                v-if="holding.returnRate !== null"
                class="pstock-rate"
                :class="holding.returnRate >= 0 ? 'pos' : 'neg'"
              >
                {{ fmtRate(holding.returnRate) }}
              </span>

              <span v-else class="pstock-rate" style="color:#9ca3af">
                -
              </span>
            </div>
          </div>

          <p v-else class="empty-hint">보유 종목이 없습니다.</p>
        </template>

        <template v-else>
          <div class="portfolio-stats">
            <div class="pstat">
              <p class="pstat-label">총 가입금액</p>
              <p class="pstat-val">{{ fmt(depositTotalAmount) }}원</p>
            </div>

            <div class="pstat">
              <p class="pstat-label">예상 연 이자</p>
              <p class="pstat-val pos">{{ fmt(depositExpectedInterest) }}원</p>
            </div>

            <div class="pstat">
              <p class="pstat-label">평균 금리</p>
              <p class="pstat-val deposit-rate-text">{{ fmtDepositRate(depositAverageRate) }}</p>
            </div>
          </div>

          <div v-if="depositPortfolioItems.length" class="portfolio-stocks">
            <div
              v-for="(item, index) in depositPortfolioItems"
              :key="item.id"
              class="pstock-row"
            >
              <span class="pstock-name deposit-name" :title="item.name">
                {{ item.name }}
              </span>

              <div class="pstock-bar-track">
                <div
                  class="pstock-bar-fill"
                  :style="{
                    width: `${Math.round(item.proportion)}%`,
                    background: item.id === '__deposit_etc__'
                      ? '#9ca3af'
                      : ['#1b78fd', '#2adbc6', '#8b5cf6'][index % 3]
                  }"
                />
              </div>

              <span class="pstock-pct">
                {{ Math.round(item.proportion) }}%
              </span>

              <span
                v-if="item.finalRate !== null"
                class="pstock-rate deposit-rate"
                :title="`${item.bankName} ${productTypeLabel(item.productType)}`"
              >
                {{ fmtDepositRate(item.finalRate) }}
              </span>

              <span v-else class="pstock-rate" style="color:#9ca3af">
                -
              </span>
            </div>
          </div>

          <p v-else class="empty-hint">
            담은 예금·적금 상품이 없습니다.
          </p>
        </template>
      </section>

      <!-- ⑤ 팔로워 / 팔로잉 탭 -->
      <section ref="tabSectionRef" class="info-section">
        <div class="tab-header">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'followers' }"
            type="button"
            @click="activeTab = 'followers'"
          >
            팔로워 {{ followStore.followerCount }}
          </button>

          <button
            class="tab-btn"
            :class="{ active: activeTab === 'following' }"
            type="button"
            @click="activeTab = 'following'"
          >
            팔로잉 {{ followStore.followingCount }}
          </button>
        </div>

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
              type="button"
              @click.stop="followStore.toggleFollow(user.id)"
            >
              {{ followStore.isFollowing(user.id) ? '팔로잉' : '팔로우' }}
            </button>
          </div>

          <p v-if="!followerUsers.length" class="empty-hint">
            팔로워가 없습니다.
          </p>
        </div>

        <div v-if="activeTab === 'following'" class="user-list">
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
              type="button"
              @click.stop="followStore.unfollow(user.id)"
            >
              팔로잉
            </button>
          </div>

          <p v-if="!followingUsers.length" class="empty-hint">
            팔로잉하는 사용자가 없습니다.
          </p>
        </div>
      </section>
    </div>

    <UserProfileModal
      v-if="selectedUserId !== null"
      :userId="selectedUserId"
      @close="closeProfile"
    />

    <!-- 재검사 확인 모달 -->
    <div v-if="showRetestModal" class="modal-overlay" @click.self="showRetestModal = false">
      <div class="modal-card">

        <div class="modal-header">
          <div class="modal-header-icon">📋</div>
          <div>
            <h3 class="modal-title">투자 성향 재검사</h3>
            <p class="modal-subtitle">시작 전 아래 내용을 확인해주세요</p>
          </div>
          <button class="modal-close" type="button" @click="showRetestModal = false">✕</button>
        </div>

        <div class="modal-notices">
          <div class="modal-notice-item notice-blue">
            <span class="notice-icon">📅</span>
            <div class="notice-body">
              <p class="notice-label">검사 주기 제한</p>
              <p class="notice-text">
                성향 검사는 <strong>30일에 한 번</strong>만 가능합니다.<br />
                재검사 후 다음 가능일은 <strong>{{ nextSurveyDate || '30일 뒤' }}</strong>입니다.
              </p>
            </div>
          </div>

          <div class="modal-notice-item notice-orange">
            <span class="notice-icon">⚠️</span>
            <div class="notice-body">
              <p class="notice-label">기존 점수 초기화</p>
              <p class="notice-text">
                이전 성향 점수는 <strong>저장되지 않으며</strong> 재검사 결과로 즉시 덮어씌워집니다.
              </p>
            </div>
          </div>

          <div class="modal-notice-item notice-teal">
            <span class="notice-icon">📊</span>
            <div class="notice-body">
              <p class="notice-label">추천 종목 변경</p>
              <p class="notice-text">
                재검사 결과에 따라 <strong>추천 종목이 변경</strong>될 수 있습니다.
              </p>
            </div>
          </div>

          <div class="modal-notice-item notice-red">
            <span class="notice-icon">🚫</span>
            <div class="notice-body">
              <p class="notice-label">커뮤니티 글 수정 불가</p>
              <p class="notice-text">
                성향 변경 후에는 <strong>이전 성향으로 작성한 글을 수정할 수 없습니다.</strong>
              </p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-btn-cancel" type="button" @click="showRetestModal = false">
            취소
          </button>
          <button class="modal-btn-confirm" type="button" @click="confirmRetest">
            재검사 시작
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-shell {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Noto Sans KR', sans-serif;
  display: flex;
  flex-direction: column;
}

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

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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
  font-size: 22px;
  color: #000;
}

.page-title {
  font-weight: 700;
  font-size: 18px;
  color: #111827;
}

.btn-home {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 7px 16px;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.btn-home:hover {
  border-color: #1b78fd;
}

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

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 700;
  font-size: 14px;
}

.blue {
  color: #1b78fd;
}

.user-type {
  font-size: 11px;
  color: #787878;
}

.mp-body {
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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

.count-btn:hover,
.count-btn.active {
  color: #1b78fd;
  background: rgba(27, 120, 253, 0.08);
}

.count-btn strong {
  color: #111827;
  font-weight: 800;
  margin-right: 2px;
}

.count-divider {
  color: #d1d5db;
}

.count-text strong {
  color: #111827;
  font-weight: 800;
  margin-right: 2px;
}

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

.btn-edit-bio:hover {
  text-decoration: underline;
}

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

.bio-textarea:focus {
  border-color: #1b78fd;
}

.bio-edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bio-counter {
  font-size: 12px;
  color: #9ca3af;
}

.bio-counter.warn {
  color: #ef4444;
}

.bio-edit-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  height: 34px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel:hover {
  border-color: #9ca3af;
}

.btn-save {
  height: 34px;
  padding: 0 16px;
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-save:not(:disabled):hover {
  opacity: 0.88;
}

.info-section {
  background: #fff;
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-heading {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
  margin: 0 0 16px;
}

.tendency-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn-retest {
  height: 30px;
  padding: 0 14px;
  border: 1.5px solid #1b78fd;
  border-radius: 9999px;
  background: #fff;
  color: #1b78fd;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-retest:hover:not(:disabled) {
  background: #1b78fd;
  color: #fff;
}

.btn-retest:disabled {
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.tendency-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.tendency-info {
  flex: 1;
}

.tendency-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.tendency-type {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.score-badge {
  background: #1b78fd;
  color: #fff;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}

.tendency-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.score-bar-track {
  height: 8px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #2adbc6, #1b78fd);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.score-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}

.portfolio-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.portfolio-heading {
  margin: 0;
}

.portfolio-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
}

.portfolio-tab {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
}

.portfolio-tab.active {
  background: #1b78fd;
  color: #fff;
}

.portfolio-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.pstat {
  min-width: 0;
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 8px;
}


.pstat-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.pstat-val {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #111827;
}

.portfolio-stocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pstock-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pstock-name {
  font-size: 13px;
  font-weight: 600;
  width: 72px;
  flex-shrink: 0;
  color: #374151;
}

.deposit-name {
  width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pstock-bar-track {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.pstock-bar-fill {
  height: 100%;
  border-radius: 9999px;
}

.pstock-pct {
  font-size: 12px;
  color: #6b7280;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.pstock-rate {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.deposit-rate {
  color: #ef4444;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.deposit-rate-text {
  color: #ef4444;
  font-family: 'Inter', sans-serif;
  font-weight: 800;
}


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

.tab-btn.active {
  color: #1b78fd;
  border-bottom-color: #1b78fd;
}

.tab-btn:not(.active):hover {
  color: #374151;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

.user-card:hover {
  background: #fafafa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-card-info {
  flex: 1;
  min-width: 0;
}

.user-card-name {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.user-card-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

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

.follow-btn:hover:not(.following) {
  background: #1b78fd;
  color: #fff;
}

.follow-btn.following {
  border-color: #e5e7eb;
  background: #f9fafb;
  color: #9ca3af;
}

.follow-btn.following:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.pos {
  color: #ef4444;
}

.neg {
  color: #3b82f6;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 720px) {
  .mp-header {
    padding: 0 18px;
  }

  .header-right {
    gap: 8px;
  }

  .btn-home {
    display: none;
  }

  .mp-body {
    padding: 24px 16px 48px;
  }

  .portfolio-stats {
    grid-template-columns: 1fr;
  }

  .portfolio-heading-row {
    align-items: flex-start;
    flex-direction: column;
  }
}

.deposit-remove-btn {
  flex-shrink: 0;
  width: 58px;
  height: 28px;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fff;
  color: #ef4444;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}

.deposit-remove-btn:hover:not(:disabled) {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.deposit-remove-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.deposit-remove-placeholder {
  flex-shrink: 0;
  width: 58px;
}

/* ── 재검사 확인 모달 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}

.modal-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin: 3px 0 0;
}

.modal-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 16px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  flex-shrink: 0;
}

.modal-close:hover {
  color: #374151;
}

.modal-notices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
}

.modal-notice-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border-left: 4px solid transparent;
}

.notice-blue   { background: #eff6ff; border-left-color: #1b78fd; }
.notice-orange { background: #fff7ed; border-left-color: #f97316; }
.notice-teal   { background: #f0fdfa; border-left-color: #2adbc6; }
.notice-red    { background: #fff1f2; border-left-color: #ef4444; }

.notice-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-body {
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: 12px;
  font-weight: 800;
  color: #374151;
  margin: 0 0 4px;
  letter-spacing: 0.02em;
}

.notice-text {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

.notice-text strong {
  color: #111827;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 16px 20px 20px;
}

.modal-btn-cancel {
  flex: 1;
  height: 46px;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-btn-cancel:hover {
  border-color: #9ca3af;
  color: #374151;
}

.modal-btn-confirm {
  flex: 2;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
  box-shadow: 0 4px 14px rgba(27, 120, 253, 0.3);
}

.modal-btn-confirm:hover {
  opacity: 0.88;
}

/* ── 통합 자산 카드 ── */
.asset-card {
  padding: 22px 24px 20px;
}

.asset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.asset-date {
  font-size: 11px;
  color: #9ca3af;
}

.asset-total {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 18px;
}

.asset-total-label {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.asset-total-value {
  font-family: 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

.asset-total-value em {
  font-style: normal;
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  margin-left: 2px;
}

.asset-total-profit {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  margin-left: auto;
}

.asset-breakdown {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.asset-divider {
  height: 1px;
  background: #f3f4f6;
}

.asset-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stock-icon   { background: rgba(27, 120, 253, 0.1); }
.deposit-icon { background: rgba(42, 219, 198, 0.1); }

.asset-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.asset-item-label {
  font-size: 12px;
  color: #9ca3af;
}

.asset-item-value {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #111827;
}

.asset-item-sub {
  font-size: 12px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

</style>