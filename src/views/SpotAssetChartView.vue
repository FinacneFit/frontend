<template>
  <div class="app-shell">
    <!-- ── HEADER ── -->
    <AppHeader />

    <!-- ── BODY ── -->
    <main class="spot-page">
      <div class="spot-inner">
        <section class="page-header">
          <div>
            <p class="eyebrow">Spot Asset Price Chart</p>
            <h1>현물 자산 가격 차트</h1>
            <p class="description">
              금과 은의 과거 가격 데이터를 기반으로 현물 자산 가격 흐름을 확인할 수 있습니다.
            </p>
          </div>

          <div class="asset-tabs">
            <button
              type="button"
              :class="{ active: selectedAsset === 'gold' }"
              @click="selectedAsset = 'gold'"
            >
              금
            </button>
            <button
              type="button"
              :class="{ active: selectedAsset === 'silver' }"
              @click="selectedAsset = 'silver'"
            >
              은
            </button>
          </div>
        </section>

        <section class="filter-card">
          <div class="filter-header">
            <div>
              <h2>기간 선택</h2>
              <p>
                시작일과 종료일을 선택하면 해당 기간의 {{ currentMeta.label }} 가격 데이터만 표시됩니다.
              </p>
            </div>

            <button type="button" class="btn-reset" @click="resetDateFilter">
              전체 기간 보기
            </button>
          </div>

          <div class="filter-row">
            <label class="date-field">
              <span>시작일</span>
              <input
                v-model="startDate"
                type="date"
                :min="minAvailableDate"
                :max="maxAvailableDate"
              />
            </label>

            <label class="date-field">
              <span>종료일</span>
              <input
                v-model="endDate"
                type="date"
                :min="minAvailableDate"
                :max="maxAvailableDate"
              />
            </label>

            <div class="filter-summary">
              <span>조회 데이터</span>
              <strong>{{ filteredPrices.length.toLocaleString() }}개</strong>
            </div>
          </div>

          <p v-if="dateErrorMessage" class="filter-message error">
            {{ dateErrorMessage }}
          </p>

          <p v-else-if="isDateFiltered" class="filter-message">
            {{ startDate || minAvailableDate }}부터 {{ endDate || maxAvailableDate }}까지의 데이터를 표시합니다.
          </p>

          <p v-else class="filter-message">
            날짜를 선택하지 않아 전체 기간 데이터를 표시합니다.
          </p>
        </section>

        <section class="chart-card">
          <div class="chart-header">
            <div>
              <h2>{{ currentMeta.label }} 가격 추이</h2>
              <p>{{ currentMeta.unit }}</p>
            </div>

            <div class="latest-price" v-if="latestPrice">
              <span>선택 기간 최근 가격</span>
              <strong>{{ formatPrice(latestPrice.close) }}</strong>
              <small>{{ latestPrice.date }}</small>
            </div>
          </div>

          <div v-if="chartPoints.length > 0" class="chart-wrap">
            <svg viewBox="0 0 900 320" class="line-chart" preserveAspectRatio="none">
              <line
                v-for="tick in yTicks"
                :key="tick.y"
                x1="60"
                :y1="tick.y"
                x2="870"
                :y2="tick.y"
                class="grid-line"
              />

              <polyline :points="chartPointsString" class="price-line" />

              <circle
                v-for="point in markerPoints"
                :key="point.date"
                :cx="point.x"
                :cy="point.y"
                r="4"
                class="price-dot"
              />

              <text
                v-for="tick in yTicks"
                :key="tick.label"
                x="12"
                :y="tick.y + 4"
                class="axis-label"
              >
                {{ tick.label }}
              </text>

              <text
                v-for="label in xLabels"
                :key="label.date"
                :x="label.x"
                y="305"
                class="axis-label x-label"
              >
                {{ label.date }}
              </text>
            </svg>
          </div>

          <div v-else class="empty-state">
            {{ chartEmptyMessage }}
          </div>
        </section>

        <section class="summary-grid">
          <article class="summary-card">
            <span>선택 기간 최고가</span>
            <strong>{{ formatPrice(maxPrice) }}</strong>
          </article>

          <article class="summary-card">
            <span>선택 기간 최저가</span>
            <strong>{{ formatPrice(minPrice) }}</strong>
          </article>

          <article class="summary-card">
            <span>선택 기간 데이터 수</span>
            <strong>{{ filteredPrices.length.toLocaleString() }}개</strong>
          </article>
        </section>

        <section class="recent-card">
          <div class="recent-header">
            <div>
              <h2>최근 가격 데이터</h2>
              <p>선택한 기간 안에서 가장 최근 날짜 기준 8개의 가격 데이터입니다.</p>
            </div>
          </div>

          <div v-if="recentRows.length > 0" class="recent-table-wrap">
            <table class="recent-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>종가</th>
                  <th>시가</th>
                  <th>고가</th>
                  <th>저가</th>
                  <th>거래량</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="row in recentRows" :key="row.date">
                  <td>{{ row.date }}</td>
                  <td>{{ formatPrice(row.close) }}</td>
                  <td>{{ formatPrice(row.open) }}</td>
                  <td>{{ formatPrice(row.high) }}</td>
                  <td>{{ formatPrice(row.low) }}</td>
                  <td>{{ formatVolume(row.volume) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state small">
            선택한 기간에 표시할 가격 데이터가 없습니다.
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import logoImg from '@/assets/logo.png'
import { spotAssetMeta, spotAssetPrices } from '../data/spotAssetPrices'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type ?? '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

function logout() {
  authStore.logout()
  router.push('/login')
}

const selectedAsset = ref('gold')
const startDate = ref('')
const endDate = ref('')

const currentMeta = computed(() => spotAssetMeta[selectedAsset.value])

const currentPrices = computed(() => {
  return spotAssetPrices[selectedAsset.value] || []
})

const minAvailableDate = computed(() => {
  if (currentPrices.value.length === 0) return ''
  return currentPrices.value[0].date
})

const maxAvailableDate = computed(() => {
  if (currentPrices.value.length === 0) return ''
  return currentPrices.value[currentPrices.value.length - 1].date
})

const isDateFiltered = computed(() => {
  return Boolean(startDate.value || endDate.value)
})

const dateErrorMessage = computed(() => {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    return '시작일은 종료일보다 늦을 수 없습니다. 날짜를 다시 선택해주세요.'
  }

  return ''
})

const filteredPrices = computed(() => {
  if (dateErrorMessage.value) {
    return []
  }

  return currentPrices.value.filter((item) => {
    const isAfterStart = startDate.value ? item.date >= startDate.value : true
    const isBeforeEnd = endDate.value ? item.date <= endDate.value : true

    return isAfterStart && isBeforeEnd
  })
})

const recentRows = computed(() => {
  return filteredPrices.value.slice(-8).reverse()
})

const latestPrice = computed(() => {
  if (filteredPrices.value.length === 0) return null
  return filteredPrices.value[filteredPrices.value.length - 1]
})

const minPrice = computed(() => {
  if (filteredPrices.value.length === 0) return null
  return Math.min(...filteredPrices.value.map((item) => item.close))
})

const maxPrice = computed(() => {
  if (filteredPrices.value.length === 0) return null
  return Math.max(...filteredPrices.value.map((item) => item.close))
})

const chartEmptyMessage = computed(() => {
  if (dateErrorMessage.value) {
    return dateErrorMessage.value
  }

  if (isDateFiltered.value) {
    return '선택한 기간에 해당하는 가격 데이터가 없습니다.'
  }

  return '차트에 표시할 데이터가 없습니다.'
})

const chartPoints = computed(() => {
  const data = filteredPrices.value

  if (data.length === 0) {
    return []
  }

  const width = 810
  const height = 240
  const startX = 60
  const startY = 30
  const priceRange = maxPrice.value - minPrice.value || 1

  return data.map((item, index) => {
    const x = startX + (index / Math.max(data.length - 1, 1)) * width
    const y = startY + height - ((item.close - minPrice.value) / priceRange) * height

    return {
      x,
      y,
      date: item.date,
      close: item.close,
    }
  })
})

const chartPointsString = computed(() => {
  return chartPoints.value.map((point) => `${point.x},${point.y}`).join(' ')
})

const markerPoints = computed(() => {
  if (chartPoints.value.length === 0) return []

  const first = chartPoints.value[0]
  const last = chartPoints.value[chartPoints.value.length - 1]
  const middle = chartPoints.value[Math.floor(chartPoints.value.length / 2)]

  return [first, middle, last]
})

const yTicks = computed(() => {
  const ticks = []
  const count = 5
  const startY = 30
  const height = 240

  if (filteredPrices.value.length === 0) {
    return []
  }

  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1)
    const price = maxPrice.value - (maxPrice.value - minPrice.value) * ratio
    const y = startY + height * ratio

    ticks.push({
      y,
      label: formatCompactPrice(price),
    })
  }

  return ticks
})

const xLabels = computed(() => {
  if (chartPoints.value.length === 0) return []

  const first = chartPoints.value[0]
  const middle = chartPoints.value[Math.floor(chartPoints.value.length / 2)]
  const last = chartPoints.value[chartPoints.value.length - 1]

  return [first, middle, last].map((point) => ({
    x: point.x,
    date: point.date.slice(2),
  }))
})

function resetDateFilter() {
  startDate.value = ''
  endDate.value = ''
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatCompactPrice(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function formatVolume(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return Number(value).toLocaleString()
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 헤더: 포트폴리오 페이지와 동일 구조 ── */
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

.btn-community {
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 8px 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.btn-community:hover {
  opacity: 0.88;
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

/* ── 현물 차트 본문 ── */
.spot-page {
  min-height: calc(100vh - 68px);
  padding: 32px 24px 40px;
  background: #f8fafc;
  color: #172033;
}

.spot-inner {
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  max-width: 960px;
  margin: 0 auto 20px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
}

.description {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.asset-tabs {
  display: flex;
  gap: 10px;
  padding: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  flex-shrink: 0;
}

.asset-tabs button {
  border: 0;
  padding: 10px 22px;
  border-radius: 999px;
  background: transparent;
  color: #475569;
  font-weight: 700;
  cursor: pointer;
}

.asset-tabs button.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
}

.filter-card {
  width: 100%;
  max-width: 960px;
  margin: 0 auto 20px;
  padding: 20px 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.filter-header h2 {
  margin: 0;
  font-size: 20px;
}

.filter-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.btn-reset {
  height: 38px;
  padding: 0 16px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.btn-reset:hover {
  border-color: #1b78fd;
  color: #1b78fd;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-field span,
.filter-summary span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.date-field input {
  width: 190px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #ffffff;
  color: #172033;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  box-sizing: border-box;
}

.date-field input:focus {
  border-color: #1b78fd;
  outline: none;
  box-shadow: 0 0 0 3px rgba(27, 120, 253, 0.12);
}

.filter-summary {
  width: 150px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.filter-summary strong {
  color: #1b78fd;
  font-size: 15px;
}

.filter-message {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
}

.filter-message.error {
  color: #ef4444;
  font-weight: 700;
}

.chart-card {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.chart-header h2 {
  margin: 0;
  font-size: 22px;
}

.chart-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.latest-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.latest-price span,
.latest-price small {
  color: #64748b;
}

.latest-price strong {
  font-size: 24px;
}

.chart-wrap {
  width: 100%;
  height: 260px;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.grid-line {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.price-line {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.price-dot {
  fill: #2563eb;
}

.axis-label {
  fill: #64748b;
  font-size: 12px;
}

.x-label {
  text-anchor: middle;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #64748b;
}

.empty-state.small {
  padding: 36px 0;
}

.summary-grid {
  width: 100%;
  max-width: 960px;
  margin: 20px auto 0;
  display: flex;
  justify-content: center;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.summary-card {
  width: 260px;
  min-width: 260px;
  height: 110px;
  padding: 22px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.summary-card span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 14px;
}

.summary-card strong {
  font-size: 24px;
}

.recent-card {
  width: 100%;
  max-width: 960px;
  margin: 20px auto 0;
  padding: 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.recent-header h2 {
  margin: 0;
  font-size: 22px;
}

.recent-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.recent-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.recent-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.recent-table th,
.recent-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: right;
  white-space: nowrap;
}

.recent-table th:first-child,
.recent-table td:first-child {
  text-align: left;
}

.recent-table th {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  background: #f8fafc;
}

.recent-table td {
  color: #172033;
  font-size: 14px;
}

.recent-table tbody tr:last-child td {
  border-bottom: 0;
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

  .btn-community,
  .btn-logout,
  .user-info {
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .spot-page {
    padding: 24px 18px 32px;
  }

  .page-header,
  .chart-header,
  .recent-header,
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-row {
    align-items: stretch;
    flex-direction: column;
  }

  .date-field input,
  .filter-summary {
    width: 100%;
  }

  .latest-price {
    align-items: flex-start;
  }

  .chart-wrap {
    height: 240px;
  }

  .summary-grid {
    justify-content: flex-start;
  }
}
</style>