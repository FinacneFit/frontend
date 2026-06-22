<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useDepositStore } from '@/stores/depositStore'
import DepositDetailPanel from '@/components/deposits/DepositDetailPanel.vue'
import DepositSaveModal from '@/components/deposits/DepositSaveModal.vue'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const depositStore = useDepositStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type || '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

// 필터 상태
const filterType = ref('all') // all | deposit | saving
const filterBanks = ref(new Set(['전체']))
const filterInterest = ref('전체') // 전체 | 단리 | 복리
const filterTerm = ref('전체')
const filterJoinMethod = ref('전체')
const sortKey = ref('bankAsc')
const searchQuery = ref('')
const expandedId = ref(null)
const saveTarget = ref(null)

// 페이지네이션
const currentPage = ref(1)
const pageSize = 8

const TERMS = ['전체', '1개월', '3개월', '6개월', '12개월', '24개월', '36개월']
const JOIN_METHODS = ['전체', '영업점', '인터넷뱅킹', '스마트뱅킹', '전화', '기타']
const TYPE_LABEL = { deposit: '예금', saving: '적금' }

function termToMonths(term) {
  return Number(String(term).replace('개월', '')) || 12
}

function resetPage() {
  currentPage.value = 1
  expandedId.value = null
}

// 백엔드에서 받아온 상품 기준으로 은행 필터 생성
const bankOptions = computed(() => {
  const banks = depositStore.products
    .map((product) => product.bankName)
    .filter(Boolean)

  const uniqueBanks = [...new Set(banks)].sort((a, b) => a.localeCompare(b, 'ko-KR'))
  return ['전체', ...uniqueBanks]
})

// 은행 멀티셀렉트
function toggleBank(bank) {
  if (bank === '전체') {
    filterBanks.value = new Set(['전체'])
  } else {
    filterBanks.value.delete('전체')

    if (filterBanks.value.has(bank)) {
      filterBanks.value.delete(bank)
    } else {
      filterBanks.value.add(bank)
    }

    if (filterBanks.value.size === 0) {
      filterBanks.value = new Set(['전체'])
    }
  }

  filterBanks.value = new Set(filterBanks.value)
  resetPage()
}

// 필터 적용
const filtered = computed(() => {
  let list = depositStore.products

  if (filterType.value !== 'all') {
    list = list.filter((product) => product.productType === filterType.value)
  }

  if (!filterBanks.value.has('전체')) {
    list = list.filter((product) => filterBanks.value.has(product.bankName))
  }

  if (filterInterest.value !== '전체') {
    list = list.filter((product) => product.interestType === filterInterest.value)
  }

  if (filterTerm.value !== '전체') {
    list = list.filter((product) => product.term === filterTerm.value)
  }

  if (filterJoinMethod.value !== '전체') {
    list = list.filter((product) => {
      const joinMethods = Array.isArray(product.joinMethods) ? product.joinMethods : []
      return joinMethods.includes(filterJoinMethod.value)
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    list = list.filter((product) => {
      const bankName = String(product.bankName ?? '').toLowerCase()
      const productName = String(product.productName ?? '').toLowerCase()

      return bankName.includes(query) || productName.includes(query)
    })
  }

  return [...list].sort((a, b) => {
    if (sortKey.value === 'rateDesc') return Number(b.maxRate) - Number(a.maxRate)
    if (sortKey.value === 'rateAsc') return Number(a.maxRate) - Number(b.maxRate)
    if (sortKey.value === 'termAsc') return termToMonths(a.term) - termToMonths(b.term)
    if (sortKey.value === 'termDesc') return termToMonths(b.term) - termToMonths(a.term)

    return String(a.bankName ?? '').localeCompare(String(b.bankName ?? ''), 'ko-KR')
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filtered.value.length / pageSize))
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize

  return filtered.value.slice(start, end)
})

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, index) => index + 1)
})

const pageStart = computed(() => {
  if (filtered.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const pageEnd = computed(() => {
  return Math.min(currentPage.value * pageSize, filtered.value.length)
})

function goPage(page) {
  if (page < 1 || page > totalPages.value) return

  currentPage.value = page
  expandedId.value = null
}

function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openModal(product) {
  saveTarget.value = product
}

async function handlePortfolioButton(product) {
  if (depositStore.isSaved(product.id)) {
    try {
      await depositStore.deleteSavedProduct(product.id)
      showToast(`${product.productName}이 포트폴리오에서 제거되었습니다.`)
    } catch (error) {
      showToast('포트폴리오에서 제거하지 못했습니다.')
    }

    return
  }

  openModal(product)
}

function closeModal() {
  saveTarget.value = null
}

function onSaved(name) {
  showToast(`${name}이 포트폴리오에 추가되었습니다.`)
}

// 필터 초기화
function resetFilters() {
  filterType.value = 'all'
  filterBanks.value = new Set(['전체'])
  filterInterest.value = '전체'
  filterTerm.value = '전체'
  filterJoinMethod.value = '전체'
  sortKey.value = 'bankAsc'
  searchQuery.value = ''
  expandedId.value = null
  currentPage.value = 1
}

// 토스트
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(message) {
  toastMsg.value = message
  toastShow.value = true

  clearTimeout(toastTimer)

  toastTimer = setTimeout(() => {
    toastShow.value = false
  }, 1800)
}

async function onRefresh() {
  try {
    await depositStore.refreshFromFSS()
    resetPage()
    showToast('금융감독원 최신 데이터로 갱신되었습니다.')
  } catch (error) {
    showToast('갱신에 실패했습니다. API 키 또는 서버 상태를 확인해 주세요.')
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    await depositStore.loadProducts()
    await depositStore.loadSavedProducts()
  } catch (error) {
    console.error('예금·적금 페이지 로딩 실패:', error)
    showToast('예금·적금 상품을 불러오지 못했습니다.')
  }
})

onUnmounted(() => {
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="page-shell">
    <AppHeader />

    <div class="page-body">
      <div class="content-wrap">
        <section class="page-head">
          <div>
            <h1 class="page-title">내 조건에 맞는 예금·적금 찾기</h1>
            <p class="page-desc">
              은행, 상품 유형, 만기, 가입 방식을 골라 나에게 맞는 금리 상품을 비교해보세요.
            </p>
          </div>

          <div class="head-actions">
            <button
              class="refresh-btn"
              :disabled="depositStore.isLoading"
              type="button"
              title="금융감독원 API에서 최신 데이터를 가져옵니다"
              @click="onRefresh"
            >
              <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="{ spinning: depositStore.isLoading }"
              >
                <path d="M1 9a8 8 0 1 0 2.4-5.6" />
                <polyline points="1 3 1 9 7 9" />
              </svg>
              {{ depositStore.isLoading ? '갱신 중...' : '데이터 갱신' }}
            </button>
          </div>
        </section>

        <section class="filter-card card">
          <div class="filter-card-title">
            <h2>필터</h2>
            <button class="reset-btn" type="button" @click="resetFilters">초기화</button>
          </div>

          <div class="filter-row">
            <div class="filter-label">상품 유형</div>
            <div class="segment-ctrl">
              <button
                v-for="opt in [['all', '전체'], ['deposit', '예금'], ['saving', '적금']]"
                :key="opt[0]"
                class="seg-btn"
                :class="{ active: filterType === opt[0] }"
                type="button"
                @click="filterType = opt[0]; resetPage()"
              >
                {{ opt[1] }}
              </button>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-label">은행</div>
            <div class="chip-group">
              <button
                v-for="bank in bankOptions"
                :key="bank"
                class="chip"
                :class="{ active: filterBanks.has(bank) }"
                type="button"
                @click="toggleBank(bank)"
              >
                {{ bank }}
              </button>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-label">이자 계산 방식</div>
            <div class="chip-group">
              <button
                v-for="opt in ['전체', '단리', '복리']"
                :key="opt"
                class="chip"
                :class="{ active: filterInterest === opt }"
                type="button"
                @click="filterInterest = opt; resetPage()"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-label">만기</div>
            <div class="chip-group">
              <button
                v-for="term in TERMS"
                :key="term"
                class="chip"
                :class="{ active: filterTerm === term }"
                type="button"
                @click="filterTerm = term; resetPage()"
              >
                {{ term }}
              </button>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-label">가입 방식</div>
            <div class="chip-group">
              <button
                v-for="joinMethod in JOIN_METHODS"
                :key="joinMethod"
                class="chip"
                :class="{ active: filterJoinMethod === joinMethod }"
                type="button"
                @click="filterJoinMethod = joinMethod; resetPage()"
              >
                {{ joinMethod }}
              </button>
            </div>
          </div>

          <div class="filter-row last">
            <div class="filter-label">정렬 방식</div>
            <div class="select-wrap">
              <select v-model="sortKey" @change="resetPage">
                <option value="bankAsc">은행순</option>
                <option value="rateDesc">최고금리 높은순</option>
                <option value="rateAsc">최고금리 낮은순</option>
                <option value="termAsc">만기 짧은순</option>
                <option value="termDesc">만기 긴순</option>
              </select>
            </div>
          </div>
        </section>

        <section class="card product-section">
          <div class="product-toolbar">
            <h2 class="result-title">
              상품 목록 <span class="count-blue">{{ filtered.length }}</span>
            </h2>

            <div class="search-box">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="17"
                height="17"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.8-3.8" />
              </svg>

              <input
                v-model="searchQuery"
                type="search"
                placeholder="은행명 또는 상품명 검색"
                @input="resetPage"
              />
            </div>
          </div>

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
                <template v-for="product in paginatedProducts" :key="product.id">
                  <tr class="product-row">
                    <td class="td-bank">{{ product.bankName }}</td>
                    <td class="td-name">{{ product.productName }}</td>

                    <td>
                      <span class="badge" :class="product.productType">
                        {{ TYPE_LABEL[product.productType] }}
                      </span>
                    </td>

                    <td>
                      <span class="rate">
                        {{ Number(product.baseRate || 0).toFixed(2) }}%
                      </span>
                    </td>

                    <td>
                      <span class="rate max">
                        {{ Number(product.maxRate || 0).toFixed(2) }}%
                      </span>
                    </td>

                    <td class="td-muted">{{ product.term }}</td>

                    <td class="td-muted">
                      {{
                        Array.isArray(product.joinMethods)
                          ? product.joinMethods.slice(0, 2).join(', ')
                          : '-'
                      }}{{ Array.isArray(product.joinMethods) && product.joinMethods.length > 2 ? ' 외' : '' }}
                    </td>

                    <td>
                      <button class="text-btn" type="button" @click="toggleDetail(product.id)">
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
                          <path d="M1 1.5L6 6.5L11 1.5" />
                        </svg>
                      </button>
                    </td>

                    <td>
                      <button
                        class="action-btn"
                        :class="{ saved: depositStore.isSaved(product.id) }"
                        type="button"
                        @click="handlePortfolioButton(product)"
                      >
                        {{ depositStore.isSaved(product.id) ? '제거' : '담기' }}
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

          <div v-if="filtered.length > 0" class="pagination-wrap">
            <p class="pagination-info">
              {{ pageStart }}-{{ pageEnd }} / 총 {{ filtered.length }}개
            </p>

            <div class="pagination-buttons">
              <button
                type="button"
                class="page-btn"
                :disabled="currentPage === 1"
                @click="goPage(currentPage - 1)"
              >
                이전
              </button>

              <button
                v-for="page in pageNumbers"
                :key="page"
                type="button"
                class="page-number"
                :class="{ active: currentPage === page }"
                @click="goPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                class="page-btn"
                :disabled="currentPage === totalPages"
                @click="goPage(currentPage + 1)"
              >
                다음
              </button>
            </div>
          </div>

          <div v-if="!depositStore.isLoading && filtered.length === 0" class="empty-state">
            조건에 맞는 상품이 없습니다. 필터를 조정해보세요.
          </div>

          <div v-if="depositStore.isLoading" class="empty-state">
            상품을 불러오는 중...
          </div>
        </section>
      </div>
    </div>

    <DepositSaveModal
      v-if="saveTarget"
      :product="saveTarget"
      @close="closeModal"
      @saved="onSaved"
    />

    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f8fc;
  font-family: 'Noto Sans KR', sans-serif;
}

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

.card {
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

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

.head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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

.refresh-btn:hover:not(:disabled) {
  background: #1b78fd;
  color: #fff;
}

.refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.refresh-btn svg {
  width: 15px;
  height: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 0.9s linear infinite;
}

.filter-card {
  padding: 22px 26px;
}

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

.reset-btn:hover {
  opacity: 0.75;
}

.filter-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 14px;
  align-items: start;
  padding: 13px 0;
  border-bottom: 1px solid #eef2f7;
}

.filter-row.last {
  border-bottom: 0;
  padding-bottom: 0;
}

.filter-label {
  padding-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

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

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

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

.chip:hover {
  border-color: #1b78fd;
  color: #1b78fd;
}

.chip.active {
  background: #1b78fd;
  color: #fff;
  border-color: #1b78fd;
  font-weight: 600;
}

.select-wrap {
  position: relative;
}

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

select:focus {
  border-color: #1b78fd;
}

.product-section {
  overflow: hidden;
}

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

.count-blue {
  color: #1b78fd;
}

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

.search-box:focus-within {
  border-color: #1b78fd;
}

.search-box svg {
  color: #94a3b8;
  flex-shrink: 0;
}

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

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

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

.product-row:hover {
  background: #fbfdff;
}

.detail-row td {
  padding: 0 14px 14px;
  background: #fff;
}

.td-bank {
  color: #374151;
  font-weight: 700;
  white-space: nowrap;
}

.td-name {
  font-weight: 700;
  color: #111827;
}

.td-muted {
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

.badge.deposit {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.saving {
  background: #dcfce7;
  color: #166534;
}

.rate {
  color: #ef4444;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}

.rate.max {
  font-size: 15px;
  font-weight: 700;
}

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

.text-btn:hover {
  color: #1b78fd;
}

.chevron {
  width: 10px;
  height: 7px;
  color: #1b78fd;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

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

.action-btn:hover {
  opacity: 0.88;
}

.action-btn.saved {
  background: #fee2e2;
  color: #ef4444;
  cursor: pointer;
}

.action-btn.saved:hover {
  background: #ef4444;
  color: #fff;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  border-top: 1px solid #eef2f7;
  background: #fff;
}

.pagination-info {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  font-family: 'Noto Sans KR', sans-serif;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn,
.page-number {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  border-radius: 9px;
  min-width: 36px;
  height: 34px;
  padding: 0 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled),
.page-number:hover {
  border-color: #1b78fd;
  color: #1b78fd;
}

.page-number.active {
  background: #1b78fd;
  border-color: #1b78fd;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.empty-state {
  padding: 52px 24px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #9ca3af;
}

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

.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .filter-label {
    padding-top: 0;
  }

  .product-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: auto;
  }

  table {
    min-width: 900px;
  }

  .pagination-wrap {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>