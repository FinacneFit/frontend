<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { spotAssetMeta, spotAssetPrices } from '@/data/spotAssetPrices'

const router = useRouter()

const selectedAsset = ref('gold')
const selectedPeriod = ref('1Y')

const periods = [
  { label: '1개월', value: '1M', months: 1 },
  { label: '3개월', value: '3M', months: 3 },
  { label: '6개월', value: '6M', months: 6 },
  { label: '1년', value: '1Y', months: 12 },
  { label: '전체', value: 'ALL', months: null },
]

const assetOptions = [
  { label: '금', value: 'gold' },
  { label: '은', value: 'silver' },
]

const currentMeta = computed(() => spotAssetMeta[selectedAsset.value])

const currentRows = computed(() => {
  return spotAssetPrices[selectedAsset.value] ?? []
})

function parseDate(dateText) {
  return new Date(`${dateText}T00:00:00`)
}

const filteredRows = computed(() => {
  const rows = currentRows.value
  if (rows.length === 0) return []

  if (selectedPeriod.value === 'ALL') return rows

  const period = periods.find((item) => item.value === selectedPeriod.value)
  const latestDate = parseDate(rows[rows.length - 1].date)

  const cutoffDate = new Date(latestDate)
  cutoffDate.setMonth(cutoffDate.getMonth() - period.months)

  return rows.filter((row) => parseDate(row.date) >= cutoffDate)
})

const latestRow = computed(() => {
  const rows = filteredRows.value
  return rows.length > 0 ? rows[rows.length - 1] : null
})

const firstRow = computed(() => {
  const rows = filteredRows.value
  return rows.length > 0 ? rows[0] : null
})

const periodReturnRate = computed(() => {
  if (!firstRow.value || !latestRow.value || firstRow.value.close === 0) return 0
  return ((latestRow.value.close - firstRow.value.close) / firstRow.value.close) * 100
})

const periodHigh = computed(() => {
  const values = filteredRows.value.map((row) => row.high ?? row.close)
  return values.length ? Math.max(...values) : 0
})

const periodLow = computed(() => {
  const values = filteredRows.value.map((row) => row.low ?? row.close)
  return values.length ? Math.min(...values) : 0
})

const recentRows = computed(() => {
  return [...filteredRows.value].reverse().slice(0, 5)
})

function formatPrice(value) {
  if (value === null || value === undefined) return '-'
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })}`
}

function formatNumber(value) {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 3,
  })
}

function formatRate(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatDate(dateText) {
  return dateText.replaceAll('-', '.')
}

// SVG 차트 설정
const chartWidth = 900
const chartHeight = 360
const padding = {
  top: 28,
  right: 36,
  bottom: 48,
  left: 76,
}

const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const chartMin = computed(() => {
  const values = filteredRows.value.map((row) => row.close)
  if (values.length === 0) return 0
  return Math.min(...values)
})

const chartMax = computed(() => {
  const values = filteredRows.value.map((row) => row.close)
  if (values.length === 0) return 0
  return Math.max(...values)
})

const chartPoints = computed(() => {
  const rows = filteredRows.value
  if (rows.length === 0) return []

  const min = chartMin.value
  const max = chartMax.value
  const range = max - min || 1

  return rows.map((row, index) => {
    const x = padding.left + (index / Math.max(rows.length - 1, 1)) * innerWidth
    const y = padding.top + ((max - row.close) / range) * innerHeight

    return {
      x,
      y,
      row,
    }
  })
})

const chartPath = computed(() => {
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const yTicks = computed(() => {
  const min = chartMin.value
  const max = chartMax.value
  const range = max - min || 1

  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = max - range * ratio
    const y = padding.top + ratio * innerHeight

    return {
      y,
      value,
    }
  })
})

const xLabels = computed(() => {
  const rows = filteredRows.value
  if (rows.length === 0) return []

  const indexes = [...new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])]

  return indexes.map((index) => {
    const x = padding.left + (index / Math.max(rows.length - 1, 1)) * innerWidth

    return {
      x,
      label: formatDate(rows[index].date),
    }
  })
})
</script>

<template>
  <div class="spot-page">
    <header class="spot-header">
      <div>
        <p class="eyebrow">현물 자산</p>
        <h1>금·은 가격 차트</h1>
        <p class="desc">기간을 선택해 금과 은의 가격 변동을 확인할 수 있습니다.</p>
      </div>

      <button class="back-btn" @click="router.push('/dashboard')">
        포트폴리오로 돌아가기
      </button>
    </header>

    <section class="control-card">
      <div class="control-group">
        <p class="control-label">자산 선택</p>
        <div class="button-row">
          <button
            v-for="asset in assetOptions"
            :key="asset.value"
            class="pill-btn"
            :class="{ active: selectedAsset === asset.value }"
            @click="selectedAsset = asset.value"
          >
            {{ asset.label }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <p class="control-label">기간 선택</p>
        <div class="button-row">
          <button
            v-for="period in periods"
            :key="period.value"
            class="pill-btn"
            :class="{ active: selectedPeriod === period.value }"
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <p>최근 종가</p>
        <strong>{{ latestRow ? formatPrice(latestRow.close) : '-' }}</strong>
        <span>{{ currentMeta.unit }}</span>
      </div>

      <div class="summary-card">
        <p>기간 등락률</p>
        <strong :class="periodReturnRate >= 0 ? 'pos' : 'neg'">
          {{ formatRate(periodReturnRate) }}
        </strong>
        <span>{{ selectedPeriod }}</span>
      </div>

      <div class="summary-card">
        <p>기간 최고가</p>
        <strong>{{ formatPrice(periodHigh) }}</strong>
        <span>High 기준</span>
      </div>

      <div class="summary-card">
        <p>기간 최저가</p>
        <strong>{{ formatPrice(periodLow) }}</strong>
        <span>Low 기준</span>
      </div>
    </section>

    <section class="chart-card">
      <div class="chart-title-row">
        <div>
          <h2>{{ currentMeta.label }} 가격 추이</h2>
          <p>Close/Last 기준</p>
        </div>
        <strong :class="periodReturnRate >= 0 ? 'pos' : 'neg'">
          {{ formatRate(periodReturnRate) }}
        </strong>
      </div>

      <div v-if="filteredRows.length > 0" class="chart-wrap">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="line-chart"
          role="img"
          aria-label="현물 자산 가격 차트"
        >
          <line
            v-for="tick in yTicks"
            :key="tick.y"
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="tick.y"
            :y2="tick.y"
            class="grid-line"
          />

          <text
            v-for="tick in yTicks"
            :key="`label-${tick.y}`"
            :x="padding.left - 12"
            :y="tick.y + 4"
            text-anchor="end"
            class="axis-label"
          >
            {{ formatNumber(tick.value) }}
          </text>

          <text
            v-for="label in xLabels"
            :key="label.label"
            :x="label.x"
            :y="chartHeight - 14"
            text-anchor="middle"
            class="axis-label"
          >
            {{ label.label }}
          </text>

          <path :d="chartPath" class="price-line" fill="none" />

          <circle
            v-for="point in chartPoints"
            :key="point.row.date"
            :cx="point.x"
            :cy="point.y"
            r="2.5"
            class="price-dot"
          >
            <title>
              {{ point.row.date }} / {{ formatPrice(point.row.close) }}
            </title>
          </circle>
        </svg>
      </div>

      <p v-else class="empty-text">표시할 데이터가 없습니다.</p>
    </section>

    <section class="table-card">
      <h2>최근 가격 데이터</h2>

      <table>
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
            <td>{{ formatNumber(row.volume) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.spot-page {
  min-height: 100vh;
  padding: 36px;
  background: #f5f7fb;
  color: #0f172a;
}

.spot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 800;
  color: #2278f4;
}

h1 {
  margin: 0;
  font-size: 30px;
}

.desc {
  margin: 8px 0 0;
  color: #64748b;
}

.back-btn,
.pill-btn {
  border: 0;
  cursor: pointer;
  font-weight: 800;
}

.back-btn {
  padding: 12px 18px;
  border-radius: 14px;
  background: #2278f4;
  color: white;
}

.control-card,
.chart-card,
.table-card {
  padding: 24px;
  border-radius: 22px;
  background: white;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.control-card {
  display: flex;
  gap: 32px;
  margin-bottom: 18px;
}

.control-label {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 800;
  color: #475569;
}

.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-btn {
  padding: 10px 16px;
  border-radius: 999px;
  background: #edf2f7;
  color: #475569;
}

.pill-btn.active {
  background: linear-gradient(135deg, #2278f4, #2dd4bf);
  color: white;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  padding: 20px;
  border-radius: 18px;
  background: white;
  border: 1px solid #e5e7eb;
}

.summary-card p {
  margin: 0 0 8px;
  color: #94a3b8;
  font-weight: 800;
}

.summary-card strong {
  display: block;
  font-size: 22px;
}

.summary-card span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.chart-card {
  margin-bottom: 18px;
}

.chart-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.chart-title-row h2,
.table-card h2 {
  margin: 0;
  font-size: 20px;
}

.chart-title-row p {
  margin: 6px 0 0;
  color: #94a3b8;
}

.chart-title-row strong {
  font-size: 22px;
}

.chart-wrap {
  width: 100%;
  overflow-x: auto;
}

.line-chart {
  width: 100%;
  min-width: 760px;
}

.grid-line {
  stroke: #e5e7eb;
  stroke-width: 1;
}

.axis-label {
  fill: #94a3b8;
  font-size: 12px;
}

.price-line {
  stroke: #2278f4;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.price-dot {
  fill: #2278f4;
}

.pos {
  color: #ef4444;
}

.neg {
  color: #2563eb;
}

.empty-text {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
}

table {
  width: 100%;
  margin-top: 16px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: right;
}

th:first-child,
td:first-child {
  text-align: left;
}

th {
  color: #64748b;
  font-size: 13px;
}

td {
  font-weight: 700;
}

@media (max-width: 900px) {
  .spot-page {
    padding: 20px;
  }

  .spot-header,
  .control-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>