<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useDepositStore } from '@/stores/depositStore'
import { BANKS } from '@/data/mockDeposits'
import DepositDetailPanel from '@/components/deposits/DepositDetailPanel.vue'
import DepositSaveModal from '@/components/deposits/DepositSaveModal.vue'
import logoImg from '@/assets/logo.png'
import AppHeader from '@/components/AppHeader.vue'

const router       = useRouter()
const authStore    = useAuthStore()
const depositStore = useDepositStore()

const nickname   = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type || '안정추구형')
const initial    = computed(() => nickname.value.charAt(0))

// ── 필터 상태 ──
const filterType        = ref('all')        // all | deposit | saving
const filterBanks       = ref(new Set(['전체']))
const filterInterest    = ref('전체')        // 전체 | 단리 | 복리
const filterTerm        = ref('전체')
const filterJoinMethod  = ref('전체')
const sortKey           = ref('bankAsc')
const searchQuery       = ref('')
const expandedId        = ref(null)
const saveTarget        = ref(null)

const TERMS        = ['전체', '1개월', '3개월', '6개월', '12개월', '24개월', '36개월']
const JOIN_METHODS = ['전체', '영업점', '인터넷뱅킹', '스마트뱅킹', '전화', '기타']
const TYPE_LABEL   = { deposit: '예금', saving: '적금' }

function termToMonths(t) { return Number(t.replace('개월', '')) || 12 }

// ── 은행 멀티셀렉트 ──
function toggleBank(bank) {
  if (bank === '전체') {
    filterBanks.value = new Set(['전체'])
  } else {
    filterBanks.value.delete('전체')
    if (filterBanks.value.has(bank)) filterBanks.value.delete(bank)
    else filterBanks.value.add(bank)
    if (filterBanks.value.size === 0) filterBanks.value = new Set(['전체'])
  }
  expandedId.value = null
  filterBanks.value = new Set(filterBanks.value)
}

// ── 필터 적용 ──
const filtered = computed(() => {
  let list = depositStore.products
  if (filterType.value !== 'all')
    list = list.filter((p) => p.productType === filterType.value)
  if (!filterBanks.value.has('전체'))
    list = list.filter((p) => filterBanks.value.has(p.bankName))
  if (filterInterest.value !== '전체')
    list = list.filter((p) => p.interestType === filterInterest.value)
  if (filterTerm.value !== '전체')
    list = list.filter((p) => p.term === filterTerm.value)
  if (filterJoinMethod.value !== '전체')
    list = list.filter((p) => p.joinMethods.includes(filterJoinMethod.value))
  const q = searchQuery.value.trim().toLowerCase()
  if (q)
    list = list.filter(
      (p) => p.bankName.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q)
    )

  return [...list].sort((a, b) => {
    if (sortKey.value === 'rateDesc') return b.maxRate - a.maxRate
    if (sortKey.value === 'rateAsc')  return a.maxRate - b.maxRate
    if (sortKey.value === 'termAsc')  return termToMonths(a.term) - termToMonths(b.term)
    if (sortKey.value === 'termDesc') return termToMonths(b.term) - termToMonths(a.term)
    return a.bankName.localeCompare(b.bankName, 'ko-KR')
  })
})

const summaryMaxRate = computed(() =>
  filtered.value.length
    ? Math.max(...filtered.value.map((p) => p.maxRate)).toFixed(2)
    : '0.00'
)

function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openModal(product) { saveTarget.value = product }
function closeModal()       { saveTarget.value = null }

function onSaved(name) {
  showToast(`${name}이 포트폴리오에 추가되었습니다.`)
}

// ── 필터 초기화 ──
function resetFilters() {
  filterType.value = 'all'
  filterBanks.value = new Set(['전체'])
  filterInterest.value = '전체'
  filterTerm.value = '전체'
  filterJoinMethod.value = '전체'
  sortKey.value = 'bankAsc'
  searchQuery.value = ''
  expandedId.value = null
}

// ── 토스트 ──
const toastMsg  = ref('')
const toastShow = ref(false)
let _toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => { toastShow.value = false }, 1800)
}

async function onRefresh() {
  try {
    await depositStore.refreshFromFSS()
    showToast('금융감독원 최신 데이터로 갱신되었습니다.')
  } catch {
    showToast('갱신에 실패했습니다. API 키를 확인해 주세요.')
  }
}

function logout() { authStore.logout(); router.push('/login') }

onMounted(() => depositStore.loadProducts())
onUnmounted(() => clearTimeout(_toastTimer))
</script>

<template>
  <div class="page-shell">

    <!-- ── 헤더 ── -->
    <AppHeader />

    <!-- ── 본문 ── -->
    <div class="page-body">
      <div class="content-wrap">

        <!-- 페이지 헤더 -->
        <section class="page-head">
          <div>
            <h1 class="page-title">내 조건에 맞는 예금·적금 찾기</h1>
            <p class="page-desc">은행, 상품 유형, 만기, 가입 방식을 골라 나에게 맞는 금리 상품을 비교해보세요.</p>
          </div>
          <div class="summary-cards">
            <div class="summary-card">
              <span>검색 결과</span>
              <strong>{{ filtered.length }}개</strong>
            </div>
            <div class="summary-card">
              <span>최고 금리</span>
              <strong>{{ summaryMaxRate }}%</strong>
            </div>
            <button
              class="refresh-btn"
              :disabled="depositStore.isLoading"
              type="button"
              @click="onRefresh"
              title="금융감독원 API에서 최신 데이터를 가져옵니다"
            >
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round"
                   :class="{ spinning: depositStore.isLoading }">
                <path d="M1 9a8 8 0 1 0 2.4-5.6"/>
                <polyline points="1 3 1 9 7 9"/>
              </svg>
              {{ depositStore.isLoading ? '갱신 중...' : '데이터 갱신' }}
            </button>
          </div>
        </section>

        <!-- 필터 카드 -->
        <section class="filter-card card">
          <div class="filter-card-title">
            <h2>필터</h2>
            <button class="reset-btn" type="button" @click="resetFilters">초기화</button>
          </div>

          <!-- 상품 유형 -->
          <div class="filter-row">
            <div class="filter-label">상품 유형</div>
            <div class="segment-ctrl">
              <button
                v-for="opt in [['all','전체'],['deposit','예금'],['saving','적금']]"
                :key="opt[0]"
                class="seg-btn"
                :class="{ active: filterType === opt[0] }"
                type="button"
                @click="filterType = opt[0]; expandedId = null"
              >{{ opt[1] }}</button>
            </div>
          </div>

          <!-- 은행 -->
          <div class="filter-row">
            <div class="filter-label">은행</div>
            <div class="chip-group">
              <button
                v-for="bank in BANKS"
                :key="bank"
                class="chip"
                :class="{ active: filterBanks.has(bank) }"
                type="button"
                @click="toggleBank(bank)"
              >{{ bank }}</button>
            </div>
          </div>

          <!-- 이자 계산 방식 -->
          <div class="filter-row">
            <div class="filter-label">이자 계산 방식</div>
            <div class="chip-group">
              <button
                v-for="opt in ['전체','단리','복리']"
                :key="opt"
                class="chip"
                :class="{ active: filterInterest === opt }"
                type="button"
                @click="filterInterest = opt; expandedId = null"
              >{{ opt }}</button>
            </div>
          </div>

          <!-- 만기 -->
          <div class="filter-row">
            <div class="filter-label">만기</div>
            <div class="chip-group">
              <button
                v-for="t in TERMS"
                :key="t"
                class="chip"
                :class="{ active: filterTerm === t }"
                type="button"
                @click="filterTerm = t; expandedId = null"
              >{{ t }}</button>
            </div>
          </div>

          <!-- 가입 방식 -->
          <div class="filter-row">
            <div class="filter-label">가입 방식</div>
            <div class="chip-group">
              <button
                v-for="jm in JOIN_METHODS"
                :key="jm"
                class="chip"
                :class="{ active: filterJoinMethod === jm }"
                type="button"
                @click="filterJoinMethod = jm; expandedId = null"
              >{{ jm }}</button>
            </div>
          </div>

          <!-- 정렬 방식 -->
          <div class="filter-row last">
            <div class="filter-label">정렬 방식</div>
            <div class="select-wrap">
              <select v-model="sortKey">
                <option value="bankAsc">은행순</option>
                <option value="rateDesc">최고금리 높은순</option>
                <option value="rateAsc">최고금리 낮은순</option>
                <option value="termAsc">만기 짧은순</option>
                <option value="termDesc">만기 긴순</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 상품 목록 카드 -->
        <section class="card product-section">
          <!-- 툴바 -->
          <div class="product-toolbar">
            <h2 class="result-title">
              상품 목록 <span class="count-blue">{{ filtered.length }}</span>
            </h2>
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.8-3.8" />
              </svg>
              <input
                v-model="searchQuery"
                type="search"
                placeholder="은행명 또는 상품명 검색"
                @input="expandedId = null"
              />
            </div>
          </div>

          <!-- 테이블 -->
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>은행</th>
                  <th>상품명</th>
                  <th>상품유형</th>
                  <th>기본금리</th>
                  <th>최고금리</th>
                  <th>만기</th>
                  <th>가입방식</th>
                  <th>상세정보</th>
                  <th>포트폴리오</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="product in filtered" :key="product.id">
                  <tr class="product-row">
                    <td class="td-bank">{{ product.bankName }}</td>
                    <td class="td-name">{{ product.productName }}</td>
                    <td>
                      <span class="badge" :class="product.productType">
                        {{ TYPE_LABEL[product.productType] }}
                      </span>
                    </td>
                    <td>
                      <span class="rate">{{ product.baseRate.toFixed(2) }}%</span>
                    </td>
                    <td>
                      <span class="rate max">{{ product.maxRate.toFixed(2) }}%</span>
                    </td>
                    <td class="td-muted">{{ product.term }}</td>
                    <td class="td-muted">
                      {{ product.joinMethods.slice(0, 2).join(', ') }}{{ product.joinMethods.length > 2 ? ' 외' : '' }}
                    </td>
                    <td>
                      <button
                        class="text-btn"
                        type="button"
                        @click="toggleDetail(product.id)"
                      >
                        {{ expandedId === product.id ? '닫기' : '보기' }}
                        <svg
                          class="chevron"
                          :class="{ open: expandedId === product.id }"
                          viewBox="0 0 12 8"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M1 1.5L6 6.5L11 1.5"/>
                        </svg>
                      </button>
                    </td>
                    <td>
                      <button
                        class="action-btn"
                        :class="{ saved: depositStore.isSaved(product.id) }"
                        type="button"
                        @click="openModal(product)"
                      >
                        {{ depositStore.isSaved(product.id) ? '추가됨' : '담기' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="expandedId === product.id" class="detail-row">
                    <td colspan="9">
                      <DepositDetailPanel :product="product" />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- 빈 상태 -->
          <div v-if="!depositStore.isLoading && filtered.length === 0" class="empty-state">
            조건에 맞는 상품이 없습니다. 필터를 조정해보세요.
          </div>
          <div v-if="depositStore.isLoading" class="empty-state">
            상품을 불러오는 중...
          </div>
        </section>

      </div>
    </div>

    <!-- 담기 모달 -->
    <DepositSaveModal
      v-if="saveTarget"
      :product="saveTarget"
      @close="closeModal"
      @saved="onSaved"
    />

    <!-- 토스트 -->
    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.page-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f8fc;
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
  position: sticky;
  top: 0;
  z-index: 50;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.logo-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; gap: 8px;
}
.logo-img { width: 36px; height: 36px; object-fit: contain; }
.logo-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; color: #000; }
.page-badge {
  background: #f0f7ff; color: #1b78fd; border: 1px solid #c7d9fd;
  border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 10px;
}
.header-right { display: flex; align-items: center; gap: 12px; }
.btn-nav {
  background: none; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 7px 13px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px;
  color: #374151; cursor: pointer; transition: border-color 0.15s, color 0.15s;
}
.btn-nav:hover { border-color: #1b78fd; color: #1b78fd; }
.btn-logout {
  background: none; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 7px 13px; font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #787878; cursor: pointer;
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

/* ── 본문 ── */
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px 56px;
}
.content-wrap {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── 카드 공통 ── */
.card {
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

/* ── 페이지 헤드 ── */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}
.page-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}
.page-desc {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
}
.summary-cards { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.summary-card {
  min-width: 130px;
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.summary-card span {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid #1b78fd;
  border-radius: 8px;
  background: #fff;
  color: #1b78fd;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  align-self: center;
}
.refresh-btn:hover:not(:disabled) { background: #1b78fd; color: #fff; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.refresh-btn svg { width: 15px; height: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.9s linear infinite; }

.summary-card strong {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1b78fd;
}

/* ── 필터 카드 ── */
.filter-card { padding: 22px 26px; }
.filter-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.filter-card-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.reset-btn {
  border: 0;
  background: transparent;
  color: #1b78fd;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px;
}
.reset-btn:hover { opacity: 0.75; }

.filter-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 14px;
  align-items: start;
  padding: 13px 0;
  border-bottom: 1px solid #eef2f7;
}
.filter-row.last { border-bottom: 0; padding-bottom: 0; }
.filter-label {
  padding-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

/* 세그먼트 */
.segment-ctrl {
  display: inline-flex;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}
.seg-btn {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 7px 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.seg-btn.active {
  background: #fff;
  color: #1b78fd;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

/* 칩 */
.chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  border-radius: 999px;
  padding: 6px 13px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: #1b78fd; color: #1b78fd; }
.chip.active {
  background: #1b78fd;
  color: #fff;
  border-color: #1b78fd;
  font-weight: 600;
}

/* 셀렉트 */
.select-wrap { position: relative; }
.select-wrap::after {
  content: '⌄';
  position: absolute;
  right: 12px;
  top: 9px;
  color: #9ca3af;
  pointer-events: none;
}
select {
  appearance: none;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #374151;
  padding: 8px 34px 8px 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  min-width: 150px;
  outline: none;
  cursor: pointer;
}
select:focus { border-color: #1b78fd; }

/* ── 상품 목록 ── */
.product-section { overflow: hidden; }
.product-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #eef2f7;
}
.result-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.count-blue { color: #1b78fd; }
.search-box {
  display: flex;
  align-items: center;
  min-width: 260px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  gap: 8px;
  transition: border-color 0.15s;
}
.search-box:focus-within { border-color: #1b78fd; }
.search-box svg { color: #94a3b8; flex-shrink: 0; }
.search-box input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  padding: 9px 6px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #374151;
}

/* ── 테이블 ── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead th {
  background: #f9fafb;
  color: #6b7280;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
tbody td {
  padding: 15px 14px;
  border-bottom: 1px solid #f3f4f6;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  vertical-align: middle;
}
.product-row:hover { background: #fbfdff; }
.detail-row td {
  padding: 0 14px 14px;
  background: #fff;
}

.td-bank {
  font-family: 'Noto Sans KR', sans-serif;
  color: #374151;
  font-weight: 700;
  white-space: nowrap;
}
.td-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  color: #111827;
}
.td-muted {
  font-family: 'Noto Sans KR', sans-serif;
  color: #9ca3af;
  font-size: 13px;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.badge.deposit { background: #dbeafe; color: #1d4ed8; }
.badge.saving  { background: #dcfce7; color: #166534; }

.rate { color: #1b78fd; font-weight: 700; font-family: 'Inter', sans-serif; }
.rate.max { font-size: 15px; font-weight: 700; }

.text-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
  line-height: 1;
}
.text-btn:hover { color: #1b78fd; }
.chevron {
  width: 10px;
  height: 7px;
  color: #1b78fd;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}
.chevron.open { transform: rotate(180deg); }

.action-btn {
  border: 0;
  border-radius: 10px;
  background: #1b78fd;
  color: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 16px;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.action-btn:hover { opacity: 0.88; }
.action-btn.saved {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: default;
}

/* ── 빈 상태 ── */
.empty-state {
  padding: 52px 24px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #9ca3af;
}

/* ── 토스트 ── */
.toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%) translateY(24px);
  opacity: 0;
  pointer-events: none;
  background: #0f172a;
  color: #fff;
  border-radius: 999px;
  padding: 12px 20px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.2);
  transition: all 0.2s ease;
  z-index: 2000;
  white-space: nowrap;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ── 반응형 ── */
@media (max-width: 900px) {
  .page-head { flex-direction: column; align-items: flex-start; }
  .filter-row { grid-template-columns: 1fr; gap: 8px; }
  .filter-label { padding-top: 0; }
  .product-toolbar { flex-direction: column; align-items: stretch; }
  .search-box { min-width: auto; }
  table { min-width: 900px; }
}
</style>
