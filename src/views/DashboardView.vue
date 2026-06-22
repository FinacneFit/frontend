<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useChatStore } from '@/stores/chatStore'
import { stockApi } from '@/api/stockApi'
import PortfolioAllocationChart from '@/components/PortfolioAllocationChart.vue'
import AiChatPanel from '@/components/AiChatPanel.vue'
import AddStockModal from '@/components/AddStockModal.vue'
import logoImg from '@/assets/logo.png'

const router         = useRouter()
const authStore      = useAuthStore()
const surveyStore    = useSurveyStore()
const portfolioStore = usePortfolioStore()
const chatStore      = useChatStore()

const nickname   = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type || surveyStore.resultType || '안정추구형')
const riskScore  = computed(() => authStore.user?.risk_score  || surveyStore.riskScore  || 0)
const initial    = computed(() => nickname.value.charAt(0))

// ── 추천 종목 ──
const recommendedStocks = ref([])
async function loadRecommended() {
  try { recommendedStocks.value = await stockApi.getRecommended() } catch (_) {}
}

// ── 검색 ──
const searchQuery   = ref('')
const searchResults = ref([])
const showDropdown  = computed(() =>
  searchQuery.value.trim().length > 0 && searchResults.value.length > 0
)
let searchTimer = null
watch(searchQuery, (q) => {
  clearTimeout(searchTimer)
  if (!q.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try { searchResults.value = await stockApi.search(q.trim()) } catch (_) {}
  }, 300)
})
function clearSearch() { searchQuery.value = ''; searchResults.value = [] }
function addFromSearch(stock) { clearSearch(); openModal(stock) }

const stats = computed(() => portfolioStore.holdingsWithStats)

function fmt(n) { return Number(n).toLocaleString() }
function fmtRate(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

function clickReason(stock) { chatStore.askReason(stock.name) }
function logout() { authStore.logout(); router.push('/login') }

// ── 종목 담기 모달 ──
const selectedStock = ref(null)
function openModal(stock) { selectedStock.value = stock }
function closeModal()     { selectedStock.value = null }
async function handleConfirm({ stock, qty, buyPrice }) {
  await portfolioStore.addHolding(stock, qty, buyPrice)
}

let _recTimer = null

onMounted(() => {
  authStore.refreshMe()
  portfolioStore.loadPortfolio()
  portfolioStore.startPolling()
  loadRecommended()
  _recTimer = setInterval(loadRecommended, 60_000)
})

onUnmounted(() => {
  portfolioStore.stopPolling()
  if (_recTimer) { clearInterval(_recTimer); _recTimer = null }
})
</script>

<template>
  <div class="app-shell">
    <!-- ── HEADER ── -->
    <header class="app-header">
      <div class="header-left">
        <button class="logo-btn" @click="router.push('/dashboard')">
          <img :src="logoImg" class="logo-img" alt="FinFit" />
          <span class="logo-text">FinFit</span>
        </button>
      </div>
      <div class="header-right">
        <button class="btn-community" @click="router.push('/community')">커뮤니티로 이동</button>
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

    <!-- ── BODY ── -->
    <div class="app-body">
      <!-- LEFT: 맞춤 추천 -->
      <aside class="left-panel">
        <div class="panel-title-row">
          <span class="panel-title">맞춤 추천</span>
          <span class="panel-sub">성향 기반</span>
        </div>

        <div class="profile-card">
          <div class="profile-left">
            <p class="profile-type">{{ resultType }}</p>
            <p class="profile-desc">ETF, KOSPI 등 안정적인 투자 종목</p>
          </div>
          <div class="profile-score-box">
            <p class="score-label">성향점수</p>
            <p class="score-num">{{ riskScore }}</p>
          </div>
        </div>

        <p class="rec-count">추천 종목 {{ recommendedStocks.length }}개</p>

        <div v-for="stock in recommendedStocks" :key="stock.id" class="stock-card">
          <div class="stock-info">
            <div class="stock-top">
              <span class="stock-name">{{ stock.name }}</span>
              <span class="stock-price">{{ fmt(stock.price) }}</span>
            </div>
            <div class="stock-bottom">
              <span class="stock-code">{{ stock.code }} {{ stock.category }}</span>
              <span class="stock-change" :class="stock.change >= 0 ? 'pos' : 'neg'">
                {{ stock.change >= 0 ? '+' : '' }}{{ stock.change }}%
              </span>
            </div>
          </div>
          <div class="stock-actions">
            <button class="btn-reason" @click="clickReason(stock)">이유</button>
            <button class="btn-add" @click="openModal(stock)">담기</button>
          </div>
        </div>
      </aside>

      <!-- CENTER: 내 포트폴리오 -->
      <main class="center-panel">
        <h2 class="section-title">내 포트폴리오</h2>

        <!-- 검색 -->
        <div class="search-wrap">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="주식 종목을 검색하세요."
              @keydown.escape="clearSearch"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch">✕</button>
          </div>

          <!-- 검색 드롭다운 -->
          <div v-if="showDropdown" class="search-dropdown">
            <div
              v-for="s in searchResults"
              :key="s.id"
              class="search-item"
            >
              <div class="si-info">
                <span class="si-name">{{ s.name }}</span>
                <span class="si-meta">{{ s.code }} · {{ s.category }}</span>
              </div>
              <div class="si-right">
                <span class="si-price">{{ fmt(s.price) }}원</span>
                <span class="si-change" :class="s.change >= 0 ? 'pos' : 'neg'">
                  {{ s.change >= 0 ? '+' : '' }}{{ s.change }}%
                </span>
                <button class="si-add" @click="addFromSearch(s)">담기</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 요약 통계 -->
        <div class="stat-cards">
          <div class="stat-card">
            <p class="stat-label">총 투자금</p>
            <p class="stat-value">{{ fmt(portfolioStore.totalInvested) }}원</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">평가 금액</p>
            <p class="stat-value">{{ fmt(portfolioStore.totalValue) }}원</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">수익률</p>
            <p class="stat-value" :class="portfolioStore.returnRate >= 0 ? 'pos' : 'neg'">
              {{ fmtRate(portfolioStore.returnRate) }}
            </p>
          </div>
        </div>

        <!-- 비중 차트 -->
        <PortfolioAllocationChart />

        <!-- 종목 테이블 -->
        <div class="holdings-table">
          <div class="table-header">
            <span style="flex:2">종목명</span>
            <span style="flex:1;text-align:center">수량</span>
            <span style="flex:1;text-align:right">매입가</span>
            <span style="flex:1;text-align:right">현재가</span>
            <span style="flex:1;text-align:right">수익률</span>
          </div>
          <!-- 보유 종목만 내부 스크롤 -->
          <div class="holdings-scroll">
            <div v-for="h in stats" :key="h.id" class="table-row">
              <div style="flex:2">
                <p class="h-name">{{ h.name }}</p>
                <p class="h-code">{{ h.code }}</p>
              </div>
              <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px">
                <button class="qty-btn" :disabled="h.qty <= 1" @click="portfolioStore.updateQty(h.id, -1)">-</button>
                <span class="qty-val">{{ h.qty }}</span>
                <button class="qty-btn" :disabled="h.qty >= 9999" @click="portfolioStore.updateQty(h.id, +1)">+</button>
              </div>
              <span style="flex:1;text-align:right;font-size:13px">{{ fmt(h.buyPrice) }}</span>
              <span style="flex:1;text-align:right;font-size:13px">{{ fmt(h.currentPrice) }}</span>
              <div style="flex:1;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <span class="h-return" :class="h.returnRate >= 0 ? 'pos' : 'neg'">
                  {{ fmtRate(h.returnRate) }}
                </span>
                <button class="btn-delete" @click="portfolioStore.removeHolding(h.id)">삭제</button>
              </div>
            </div>
            <p v-if="!stats.length" class="empty-hint">보유 종목이 없습니다. 추천 종목을 담아보세요.</p>
          </div>
        </div>
      </main>

      <!-- RIGHT: AI 챗봇 -->
      <aside class="right-panel">
        <AiChatPanel />
      </aside>
    </div>

    <!-- ── 종목 담기 모달 ── -->
    <AddStockModal
      v-if="selectedStock"
      :stock="selectedStock"
      @confirm="handleConfirm"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 헤더 ── */
.app-header {
  height: 68px;
  border-bottom: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  background: #fff;
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
.logo-img { width: 36px; height: 36px; object-fit: contain; }
.logo-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; color: #000; }
.header-right { display: flex; align-items: center; gap: 12px; }
.btn-community {
  background: #1b78fd; color: #fff; border: none; border-radius: 14px;
  padding: 8px 18px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-community:hover { opacity: 0.88; }
.btn-logout {
  background: none; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 7px 13px; font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #787878; cursor: pointer;
}
.user-info {
  display: flex; align-items: center; gap: 8px;
  background: none; border: none; cursor: pointer; padding: 0;
}
.user-text { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; }
.name-blue { color: #1b78fd; }
.user-type { font-size: 11px; color: #787878; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff; font-weight: 700; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
}

/* ── 바디 ── */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  max-width: 1480px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* ── 왼쪽 패널 (300px) ── */
.left-panel {
  width: 300px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  padding: 16px;
  flex-shrink: 0;
}
.panel-title-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
.panel-title { font-weight: 700; font-size: 16px; }
.panel-sub { font-size: 12px; color: #9ca3af; }

.profile-card {
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  border-radius: 12px; padding: 14px; color: #fff;
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
}
.profile-type { font-weight: 700; font-size: 15px; }
.profile-desc { font-size: 11px; opacity: 0.85; margin-top: 4px; }
.profile-score-box { text-align: center; }
.score-label { font-size: 10px; opacity: 0.8; }
.score-num { font-weight: 700; font-size: 24px; }
.rec-count { font-size: 12px; color: #6b7280; margin-bottom: 8px; }

.stock-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 8px; }
.stock-info { margin-bottom: 10px; }
.stock-top { display: flex; justify-content: space-between; align-items: baseline; }
.stock-name { font-weight: 700; font-size: 14px; }
.stock-price { font-weight: 700; font-size: 14px; }
.stock-bottom { display: flex; justify-content: space-between; margin-top: 2px; }
.stock-code { font-size: 11px; color: #9ca3af; }
.stock-change { font-size: 12px; font-weight: 700; }
.stock-actions { display: flex; gap: 8px; }
.btn-reason {
  flex: 1; height: 34px; border: 1px solid #e5e7eb; border-radius: 10px;
  background: #fff; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; cursor: pointer;
}
.btn-reason:hover { border-color: #1b78fd; color: #1b78fd; }
.btn-add {
  flex: 1; height: 34px; background: #1b78fd; color: #fff; border: none;
  border-radius: 10px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer;
}
.btn-add:hover { opacity: 0.88; }

/* ── 중앙 패널 ── */
.center-panel { flex: 1; min-width: 0; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.section-title { font-weight: 700; font-size: 20px; margin: 0; }

/* 검색 */
.search-wrap { position: relative; }
.search-bar {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 14px;
}
.search-icon { font-size: 14px; }
.search-input {
  flex: 1; border: none; outline: none;
  font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #374151;
}
.search-clear {
  background: none; border: none; font-size: 14px; color: #9ca3af;
  cursor: pointer; padding: 0 2px;
}
.search-clear:hover { color: #374151; }
.search-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 100;
  max-height: 280px; overflow-y: auto;
}
.search-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid #f3f4f6;
}
.search-item:last-child { border-bottom: none; }
.search-item:hover { background: #f9fafb; }
.si-info { display: flex; flex-direction: column; gap: 2px; }
.si-name { font-weight: 700; font-size: 14px; }
.si-meta { font-size: 11px; color: #9ca3af; }
.si-right { display: flex; align-items: center; gap: 10px; }
.si-price { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; }
.si-change { font-size: 12px; font-weight: 700; }
.si-add {
  height: 30px; padding: 0 14px; background: #1b78fd; color: #fff; border: none;
  border-radius: 8px; font-family: 'Noto Sans KR', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer;
}
.si-add:hover { opacity: 0.88; }

/* 통계 카드 */
.stat-cards { display: flex; gap: 12px; }
.stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; }
.stat-label { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
.stat-value { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 18px; }

/* 테이블 */
.holdings-table { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.table-header {
  display: flex; padding: 10px 16px;
  background: #f9fafb; font-size: 12px; color: #6b7280; font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
/* 보유 종목 내부 스크롤 영역 */
.holdings-scroll {
  max-height: 260px;
  overflow-y: auto;
}
.holdings-scroll::-webkit-scrollbar { width: 4px; }
.holdings-scroll::-webkit-scrollbar-track { background: transparent; }
.holdings-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}
.holdings-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
.table-row {
  display: flex; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.table-row:last-child { border-bottom: none; }
.h-name { font-weight: 700; font-size: 14px; }
.h-code { font-size: 11px; color: #9ca3af; }
.qty-btn {
  width: 24px; height: 24px; border: 1px solid #e5e7eb; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.qty-btn:hover:not(:disabled) { border-color: #1b78fd; }
.qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.qty-val { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 14px; min-width: 24px; text-align: center; }
.h-return { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; }
.btn-delete {
  font-size: 11px; color: #9ca3af; background: none; border: none;
  cursor: pointer; text-decoration: underline;
}
.btn-delete:hover { color: #ef4444; }
.empty-hint { padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; }

/* ── 오른쪽 패널 (340px) ── */
.right-panel {
  width: 340px;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
  flex-shrink: 0;
}

.pos { color: #ef4444; }
.neg { color: #2563eb; }

/* ── 반응형: 1280px 이하 → 우측 패널 아래로 ── */
@media (max-width: 1280px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .app-body {
    flex-wrap: wrap;
    flex: unset;
    overflow: visible;
    align-items: flex-start;
  }
  .left-panel {
    height: auto;
    overflow-y: visible;
  }
  .center-panel {
    height: auto;
    overflow-y: visible;
  }
  .right-panel {
    width: 100%;
    height: 500px;
    border-left: none;
    border-top: 1px solid #e5e7eb;
    flex-shrink: unset;
  }
}

/* ── 반응형: 900px 이하 → 1열 구조 ── */
@media (max-width: 900px) {
  .app-body { flex-direction: column; }
  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  .center-panel { width: 100%; flex: unset; }
  .right-panel { width: 100%; }
}
</style>
