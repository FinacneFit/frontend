<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PortfolioAllocationChart from '@/components/PortfolioAllocationChart.vue'
import PortfolioValueChart      from '@/components/PortfolioValueChart.vue'
import PortfolioReturnChart     from '@/components/PortfolioReturnChart.vue'

// ── 슬라이더 상수 ──────────────────────────────────────────────
// DOM 순서: [clone_last(ReturnChart)] [Allocation] [Value] [Return] [clone_first(Allocation)]
const TOTAL = 3
const TRANSITION_MS = 500
const SLIDE_PCT = 100 / (TOTAL + 2)   // 20%

const trackRef   = ref(null)
const extIndex   = ref(1)              // 1 = 비중 차트 (시작)
const isAnimating = ref(false)
let timer = null

// 도트 표시용 실제 인덱스 (0, 1, 2)
const current = computed(() => {
  if (extIndex.value <= 0) return TOTAL - 1
  if (extIndex.value >= TOTAL + 1) return 0
  return extIndex.value - 1
})

// ── DOM 직접 조작 (Vue 배칭 우회, transitionend 기반 snap) ────
function applyTransform(index, animate) {
  const el = trackRef.value
  if (!el) return
  if (animate) {
    el.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
  } else {
    el.style.transition = 'none'
    void el.offsetHeight   // reflow 강제 → transition:none 즉시 확정
  }
  el.style.transform = `translateX(-${(index * SLIDE_PCT).toFixed(6)}%)`
}

function resetTimer() {
  clearInterval(timer)
  timer = setInterval(goNext, 10000)
}

function slide(delta) {
  if (isAnimating.value) return
  isAnimating.value = true

  const targetIdx = extIndex.value + delta
  extIndex.value = targetIdx
  applyTransform(targetIdx, true)
  resetTimer()

  const el = trackRef.value
  let done = false

  function onTransitionEnd(e) {
    if (e && e.propertyName !== 'transform') return
    if (done) return
    done = true
    el?.removeEventListener('transitionend', onTransitionEnd)

    if (targetIdx === TOTAL + 1) {
      extIndex.value = 1
      applyTransform(1, false)
    } else if (targetIdx === 0) {
      extIndex.value = TOTAL
      applyTransform(TOTAL, false)
    }

    requestAnimationFrame(() => { isAnimating.value = false })
  }

  el?.addEventListener('transitionend', onTransitionEnd)
  setTimeout(() => onTransitionEnd(null), TRANSITION_MS + 120)
}

function goNext() { slide(+1) }
function goPrev() { slide(-1) }

function goTo(i) {
  if (i === current.value || isAnimating.value) return
  isAnimating.value = true
  extIndex.value = i + 1
  applyTransform(i + 1, true)
  resetTimer()

  const el = trackRef.value
  let done = false
  function onTransitionEnd(e) {
    if (e && e.propertyName !== 'transform') return
    if (done) return
    done = true
    el?.removeEventListener('transitionend', onTransitionEnd)
    requestAnimationFrame(() => { isAnimating.value = false })
  }
  el?.addEventListener('transitionend', onTransitionEnd)
  setTimeout(() => onTransitionEnd(null), TRANSITION_MS + 120)
}

// ── 스와이프 ──────────────────────────────────────────────────
const swipeStart = ref(null)
function onSwipeStart(e) {
  if (isAnimating.value) return
  swipeStart.value = e.touches ? e.touches[0].clientX : e.clientX
}
function onSwipeEnd(e) {
  if (swipeStart.value === null) return
  const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
  const diff = endX - swipeStart.value
  if (diff > 50) goPrev()
  else if (diff < -50) goNext()
  swipeStart.value = null
}

onMounted(() => {
  applyTransform(1, false)
  timer = setInterval(goNext, 10000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="slider-wrap">
    <!-- 화살표 + 도트 -->
    <div class="slider-header">
      <button class="arrow-btn" @click="goPrev">‹</button>
      <div class="dots">
        <span
          v-for="i in TOTAL"
          :key="i"
          class="dot"
          :class="{ active: current === i - 1 }"
          @click="goTo(i - 1)"
        />
      </div>
      <button class="arrow-btn" @click="goNext">›</button>
    </div>

    <!-- 슬라이드 뷰포트 -->
    <div
      class="slides-viewport"
      @mousedown="onSwipeStart"
      @mouseup="onSwipeEnd"
      @touchstart.passive="onSwipeStart"
      @touchend.passive="onSwipeEnd"
    >
      <!--
        5슬롯: [clone_last=Return] [Allocation] [Value] [Return] [clone_first=Allocation]
        transform / transition 은 applyTransform() 이 직접 관리
      -->
      <div ref="trackRef" class="slides-track">
        <div class="slide-item"><PortfolioReturnChart /></div>
        <div class="slide-item"><PortfolioAllocationChart /></div>
        <div class="slide-item"><PortfolioValueChart /></div>
        <div class="slide-item"><PortfolioReturnChart /></div>
        <div class="slide-item"><PortfolioAllocationChart /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 24px 24px;
  overflow: hidden;
  background: #fff;
}

/* ── 헤더 ── */
.slider-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 14px;
}
.arrow-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0 3px;
  line-height: 1;
  transition: color 0.15s;
}
.arrow-btn:hover { color: #1b78fd; }
.dots { display: flex; gap: 6px; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.dot.active {
  background: #1b78fd;
  transform: scale(1.25);
}

/* ── 슬라이드 레일 ── */
.slides-viewport {
  overflow: hidden;
  width: 100%;
}
.slides-track {
  display: flex;
  width: 500%;    /* (TOTAL + 2) × 100% */
  will-change: transform;
  /* transition / transform 은 JS가 직접 관리 */
}
.slide-item {
  flex: 0 0 calc(100% / 5);
  min-width: 0;
  box-sizing: border-box;
  min-height: 210px;
}
</style>
