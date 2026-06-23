<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolioStore'

const portfolioStore = usePortfolioStore()

// 수익률 내림차순 정렬
const sortedByReturn = computed(() =>
  [...portfolioStore.holdingsWithStats].sort((a, b) => b.returnRate - a.returnRate)
)

// 음수 종목이 하나라도 있으면 다이버징, 없으면 단순 바 모드
const hasNegative = computed(() =>
  sortedByReturn.value.some(h => h.returnRate < 0)
)

// 절댓값 최댓값 (막대 100% 기준)
const maxAbs = computed(() => {
  const items = sortedByReturn.value
  if (!items.length) return 1
  return Math.max(...items.map(h => Math.abs(h.returnRate)), 0.01)
})

const hasData  = computed(() => portfolioStore.holdingsWithStats.length > 0)
const bestItem = computed(() => sortedByReturn.value[0] ?? null)

// 단순 모드: 왼쪽에서 채워지는 양수 바
function simpleWidth(rate) {
  if (maxAbs.value === 0) return '0%'
  return `${Math.min((Math.abs(rate) / maxAbs.value) * 100, 100)}%`
}

// 다이버징 모드: 양수 half (오른쪽 방향)
function posWidth(rate) {
  if (rate <= 0) return '0%'
  return `${Math.min((rate / maxAbs.value) * 100, 100)}%`
}
// 다이버징 모드: 음수 half (왼쪽 방향)
function negWidth(rate) {
  if (rate >= 0) return '0%'
  return `${Math.min((Math.abs(rate) / maxAbs.value) * 100, 100)}%`
}

function fmtRate(r) {
  return (r >= 0 ? '+' : '') + r.toFixed(1) + '%'
}
</script>

<template>
  <div class="chart-wrap">
    <p class="chart-title"><span class="title-dot" />수익 현황</p>

    <div v-if="!hasData" class="empty-state">아직 보유 종목이 없습니다.</div>

    <!-- ── 단순 모드: 전체 양수 ── -->
    <div v-else-if="!hasNegative" class="bars">
      <div v-for="h in sortedByReturn" :key="h.id" class="bar-row">
        <span class="bar-label">{{ h.name }}</span>
        <div class="bar-track-simple">
          <div
            class="bar-fill-pos"
            :style="{ width: simpleWidth(h.returnRate) }"
          />
        </div>
        <span class="bar-value pos-text">{{ fmtRate(h.returnRate) }}</span>
      </div>
    </div>

    <!-- ── 다이버징 모드: 음수 포함 ── -->
    <div v-else class="bars">
      <div v-for="h in sortedByReturn" :key="h.id" class="bar-row">
        <span class="bar-label">{{ h.name }}</span>

        <div class="dbar-track">
          <!-- 음수 half: 오른쪽 정렬 (왼쪽 방향) -->
          <div class="dbar-neg-half">
            <div class="dbar-fill-neg" :style="{ width: negWidth(h.returnRate) }" />
          </div>
          <!-- 기준선 -->
          <div class="dbar-zero" />
          <!-- 양수 half: 왼쪽 정렬 (오른쪽 방향) -->
          <div class="dbar-pos-half">
            <div class="dbar-fill-pos" :style="{ width: posWidth(h.returnRate) }" />
          </div>
        </div>

        <span
          class="bar-value"
          :class="h.returnRate >= 0 ? 'pos-text' : 'neg-text'"
        >{{ fmtRate(h.returnRate) }}</span>
      </div>
    </div>

    <p v-if="bestItem" class="chart-caption">
      최고 수익: {{ bestItem.name }}
      <span class="pos-text">{{ fmtRate(bestItem.returnRate) }}</span>
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

/* ── 공통 행 레이아웃 ── */
.bars { display: flex; flex-direction: column; gap: 16px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
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

/* ── 단순 모드 (전체 양수) ── */
.bar-track-simple {
  flex: 1;
  height: 14px;
  background: #eef0f5;
  border-radius: 9999px;
  overflow: hidden;
}
.bar-fill-pos {
  height: 100%;
  background: #ef4444;
  border-radius: 9999px;
  transition: width 0.45s ease;
  min-width: 3px;
}

/* ── 다이버징 모드 ── */
.dbar-track {
  flex: 1;
  display: flex;
  align-items: center;
}
/* 음수 half: 오른쪽에서 채워짐, 배경 아주 연하게 */
.dbar-neg-half {
  flex: 1;
  height: 14px;
  background: #f5f6f8;
  border-radius: 9999px 0 0 9999px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: hidden;
}
/* 양수 half: 왼쪽에서 채워짐 */
.dbar-pos-half {
  flex: 1;
  height: 14px;
  background: #f5f6f8;
  border-radius: 0 9999px 9999px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
}
.dbar-fill-pos {
  height: 100%;
  background: #ef4444;
  border-radius: 0 9999px 9999px 0;
  transition: width 0.45s ease;
}
.dbar-fill-neg {
  height: 100%;
  background: #3b82f6;
  border-radius: 9999px 0 0 9999px;
  transition: width 0.45s ease;
}
/* 기준선 (0%) */
.dbar-zero {
  width: 2px;
  height: 18px;
  background: #d1d5db;
  flex-shrink: 0;
}

/* ── 수치 표시 ── */
.bar-value {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  width: 64px;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
}
.pos-text { color: #ef4444; }
.neg-text { color: #3b82f6; }

/* ── 하단 요약 ── */
.chart-caption {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
</style>
