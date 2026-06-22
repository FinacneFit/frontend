<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolioStore'

const portfolioStore = usePortfolioStore()

const COLORS   = ['#1b78fd', '#2adbc6', '#8b5cf6', '#f59e0b']
const GRAY     = '#9ca3af'
const MAX_SHOWN = 4

// SVG 도넛 상수 (viewBox 160 × 160)
const R   = 58        // 반지름
const SW  = 20        // stroke 두께
const CX  = 80        // 중심 x
const CY  = 80        // 중심 y
const C   = 2 * Math.PI * R  // 둘레 ≈ 364.42
const GAP = 3         // 세그먼트 간 간격 (SVG 단위)

// ── 평가금액 기준 비중 데이터 (내림차순) ──
const allocationChartData = computed(() => {
  const stats = portfolioStore.holdingsWithStats
  if (!stats.length) return []
  const total = stats.reduce((s, h) => s + h.value, 0)
  if (total === 0) return []

  const sorted = [...stats].sort((a, b) => b.value - a.value)

  let items
  if (sorted.length <= MAX_SHOWN) {
    items = sorted.map((h, i) => ({
      name: h.name,
      value: h.value,
      rawPct: (h.value / total) * 100,
      color: COLORS[i],
    }))
  } else {
    items = sorted.slice(0, MAX_SHOWN).map((h, i) => ({
      name: h.name,
      value: h.value,
      rawPct: (h.value / total) * 100,
      color: COLORS[i],
    }))
    const othersValue = sorted.slice(MAX_SHOWN).reduce((s, h) => s + h.value, 0)
    items.push({
      name: '기타',
      value: othersValue,
      rawPct: (othersValue / total) * 100,
      color: GRAY,
    })
  }

  // 반올림 오차 보정 (마지막 항목 조정)
  const sum = items.reduce((s, i) => s + i.rawPct, 0)
  return items.map((item, idx) => ({
    ...item,
    pct: idx < items.length - 1
      ? Math.round(item.rawPct * 10) / 10
      : Math.round((item.rawPct + (100 - sum)) * 10) / 10,
  }))
})

// ── SVG stroke-dasharray / dashOffset ──
const segments = computed(() => {
  const data = allocationChartData.value
  if (!data.length) return []

  let cumul = 0
  return data.map(item => {
    const dashLen    = Math.max(0, (item.pct / 100) * C - GAP)
    const dashOffset = -((cumul / 100) * C)
    cumul += item.pct
    return {
      color:      item.color,
      dashArray:  `${dashLen.toFixed(3)} ${C.toFixed(3)}`,
      dashOffset: dashOffset.toFixed(3),
    }
  })
})

const hasData = computed(() => portfolioStore.holdingsWithStats.length > 0)
const topItem = computed(() => allocationChartData.value[0] ?? null)

function fmtPct(v) { return (v ?? 0).toFixed(1) + '%' }
function fmtAmt(n) { return Number(n).toLocaleString() + '원' }
</script>

<template>
  <div class="chart-wrap">
    <p class="chart-title"><span class="title-dot" />보유 종목 비중</p>

    <div v-if="!hasData" class="empty-state">아직 보유 종목이 없습니다.</div>

    <div v-else class="content-row">
      <!-- SVG 도넛 차트 -->
      <div class="donut-wrap">
        <svg viewBox="0 0 160 160" class="donut-svg">
          <!-- 배경 원 -->
          <circle
            :cx="CX" :cy="CY" :r="R"
            fill="none" stroke="#f0f1f5" :stroke-width="SW"
          />
          <!-- 데이터 세그먼트 -->
          <circle
            v-for="(seg, i) in segments"
            :key="i"
            :cx="CX" :cy="CY" :r="R"
            fill="none"
            :stroke="seg.color"
            :stroke-width="SW"
            stroke-linecap="butt"
            :stroke-dasharray="seg.dashArray"
            :stroke-dashoffset="seg.dashOffset"
            :transform="`rotate(-90 ${CX} ${CY})`"
          />
          <!-- 중앙: 비중 1위 종목명 + 비중 -->
          <text
            v-if="topItem"
            :x="CX" :y="CY - 11"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="11"
            font-weight="600"
            fill="#6b7280"
            font-family="'Noto Sans KR', sans-serif"
          >{{ topItem.name }}</text>
          <text
            v-if="topItem"
            :x="CX" :y="CY + 11"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="17"
            font-weight="800"
            :fill="topItem.color"
            font-family="'Inter', sans-serif"
          >{{ fmtPct(topItem.pct) }}</text>
        </svg>
      </div>

      <!-- 범례 -->
      <div class="legend">
        <div v-for="item in allocationChartData" :key="item.name" class="legend-row">
          <span class="legend-dot" :style="{ background: item.color }" />
          <div class="legend-info">
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-amt">{{ fmtAmt(item.value) }}</span>
          </div>
          <span class="legend-pct" :style="{ color: item.color }">{{ fmtPct(item.pct) }}</span>
        </div>
      </div>
    </div>
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

/* ── 2단 레이아웃 ── */
.content-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.donut-wrap {
  flex-shrink: 0;
  width: 170px;
}
.donut-svg { width: 100%; height: auto; display: block; }

/* ── 범례 ── */
.legend {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.legend-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}
.legend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.legend-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-amt {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}
.legend-pct {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}
</style>
