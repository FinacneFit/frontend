<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolioStore'

const portfolioStore = usePortfolioStore()

const COLORS = ['#1b78fd', '#2adbc6', '#8b5cf6', '#f59e0b', '#10b981']

const sorted = computed(() =>
  [...portfolioStore.holdingsWithStats].sort((a, b) => b.value - a.value)
)

// 상위 4개 + 나머지를 기타로 묶기
const displayRows = computed(() => {
  const top = sorted.value.slice(0, 4)
  const rest = sorted.value.slice(4)
  if (rest.length === 0) return top
  const etcValue = rest.reduce((s, h) => s + h.value, 0)
  return [...top, { id: '__etc__', name: '기타', value: etcValue }]
})

const maxValue = computed(() => displayRows.value[0]?.value ?? 0)
const hasData  = computed(() => portfolioStore.holdingsWithStats.length > 0)

function barWidth(value) {
  if (maxValue.value === 0) return '0%'
  return `${(value / maxValue.value) * 100}%`
}

function barColor(idx) { return COLORS[idx % COLORS.length] }

// 항상 정확한 원 단위 (콤마 포함) 표시
function fmt(n) { return Number(n).toLocaleString() + '원' }
</script>

<template>
  <div class="chart-wrap">
    <p class="chart-title"><span class="title-dot" />평가금액</p>

    <div v-if="!hasData" class="empty-state">아직 보유 종목이 없습니다.</div>

    <div v-else class="bars">
      <div v-for="(h, i) in displayRows" :key="h.id" class="bar-row">
        <span class="bar-label">{{ h.name }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ width: barWidth(h.value), background: barColor(i) }"
          />
        </div>
        <span class="bar-amount">{{ fmt(h.value) }}</span>
      </div>
    </div>

    <p v-if="hasData" class="chart-caption">
      총 평가금액: {{ fmt(portfolioStore.totalValue) }}
    </p>
  </div>
</template>

<style scoped>
.chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 800;
  font-size: 15px;
  color: #111827;
  margin: 0;
}
.title-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1b78fd;
  flex-shrink: 0;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #9ca3af;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
}
.bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bar-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  width: 76px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  flex: 1;
  height: 14px;
  background: #eef0f5;
  border-radius: 9999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.45s ease;
  min-width: 4px;
}
.bar-amount {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  width: 100px;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
}
.chart-caption {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
</style>
