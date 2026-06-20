<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  stock: { type: Object, required: true },
})
const emit = defineEmits(['confirm', 'close'])

const PRICE_STEP = 1000
const qty = ref(1)
const price = ref(props.stock.price || 0)
// 포맷된 가격 표시용 (쉼표 포함)
const priceStr = ref((props.stock.price || 0).toLocaleString())
const showSuccess = ref(false)

const totalAmount = computed(() => qty.value * price.value)
const isValid = computed(() => qty.value >= 1 && qty.value <= 9999 && price.value > 0)

// ── 수량 조작 ──
function decreaseQty() { if (qty.value > 1) qty.value-- }
function increaseQty() { if (qty.value < 9999) qty.value++ }
function onQtyChange(e) {
  let v = parseInt(e.target.value, 10)
  if (isNaN(v) || v < 1) v = 1
  if (v > 9999) v = 9999
  qty.value = v
}

// ── 가격 조작 ──
function decreasePrice() {
  const next = price.value - PRICE_STEP
  if (next < 1) return
  price.value = next
  priceStr.value = next.toLocaleString()
}
function increasePrice() {
  price.value += PRICE_STEP
  priceStr.value = price.value.toLocaleString()
}
function onPriceFocus(e) {
  // 포커스 시 쉼표 없이 숫자만 표시 (입력 편의)
  e.target.value = String(price.value)
}
function onPriceBlur(e) {
  const n = Math.max(1, parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 1)
  price.value = n
  priceStr.value = n.toLocaleString()
}

function fmt(n) { return Number(n).toLocaleString() }

function confirm() {
  if (!isValid.value || showSuccess.value) return
  emit('confirm', { stock: props.stock, qty: qty.value, buyPrice: price.value })
  showSuccess.value = true
  setTimeout(() => emit('close'), 1200)
}

function onKeyDown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <!-- 오버레이: 바깥 클릭 시 닫힘 -->
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">

      <!-- ── 헤더 ── -->
      <div class="modal-header">
        <div>
          <h2 class="stock-name">{{ stock.name }}</h2>
          <p class="stock-sub">{{ stock.code }}&nbsp;&nbsp;{{ stock.category }}</p>
        </div>
        <button class="close-btn" @click="$emit('close')" aria-label="닫기">✕</button>
      </div>

      <!-- ── 현재가 / 등락률 카드 ── -->
      <div class="info-cards">
        <div class="info-card">
          <p class="info-label">현재가</p>
          <p class="info-value">{{ fmt(stock.price) }}</p>
        </div>
        <div class="info-card">
          <p class="info-label">등락률</p>
          <p class="info-value" :class="(stock.change ?? 0) >= 0 ? 'pos' : 'neg'">
            {{ (stock.change ?? 0) >= 0 ? '+' : '' }}{{ stock.change ?? 0 }}%
          </p>
        </div>
      </div>

      <!-- ── 수량 ── -->
      <div class="field-section">
        <p class="field-label">수량</p>
        <div class="stepper-row">
          <button class="step-btn" :disabled="qty <= 1" @click="decreaseQty">−</button>
          <input
            type="number"
            class="step-input"
            :value="qty"
            min="1"
            max="9999"
            @change="onQtyChange"
          />
          <span class="step-unit">주</span>
          <button class="step-btn" :disabled="qty >= 9999" @click="increaseQty">+</button>
        </div>
      </div>

      <!-- ── 평균 매입가 ── -->
      <div class="field-section">
        <p class="field-label">평균 매입가</p>
        <div class="stepper-row">
          <button class="step-btn" :disabled="price <= PRICE_STEP" @click="decreasePrice">−</button>
          <input
            type="text"
            inputmode="numeric"
            class="step-input"
            :value="priceStr"
            @focus="onPriceFocus"
            @blur="onPriceBlur"
          />
          <span class="step-unit">원</span>
          <button class="step-btn" @click="increasePrice">+</button>
        </div>
      </div>

      <!-- ── 총 매수금액 ── -->
      <div class="total-row">
        <span class="total-label">총 매수금액</span>
        <span class="total-value">{{ fmt(totalAmount) }}원</span>
      </div>

      <!-- ── 피드백 + 확인 버튼 ── -->
      <p v-if="showSuccess" class="success-msg">✓ 포트폴리오에 담았습니다</p>
      <button
        class="confirm-btn"
        :disabled="!isValid || showSuccess"
        @click="confirm"
      >
        {{ showSuccess ? '담기 완료!' : '포트폴리오에 추가하기' }}
      </button>

    </div>
  </div>
</template>

<style scoped>
/* ── 오버레이 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── 모달 카드 ── */
.modal-card {
  background: #fff;
  border-radius: 20px;
  width: 480px;
  max-width: calc(100vw - 32px);
  padding: 28px 32px 32px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ── 헤더 ── */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.stock-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}
.stock-sub {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #9ca3af;
  margin-top: 5px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.close-btn:hover { color: #374151; }

/* ── 가격 정보 카드 ── */
.info-cards {
  display: flex;
  gap: 12px;
}
.info-card {
  flex: 1;
  background: #f9fafb;
  border-radius: 12px;
  padding: 14px 18px;
}
.info-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}
.info-value {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

/* ── 수량 / 가격 필드 ── */
.field-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}
.stepper-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.step-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  font-size: 18px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
  color: #374151;
  line-height: 1;
}
.step-btn:hover:not(:disabled) {
  border-color: #1b78fd;
  color: #1b78fd;
}
.step-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.step-input {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  border: none;
  outline: none;
  text-align: center;
  width: 120px;
  background: transparent;
  padding: 0;
}
/* number input 스피너 숨기기 */
.step-input::-webkit-outer-spin-button,
.step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.step-input[type='number'] { -moz-appearance: textfield; }

.step-unit {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #6b7280;
}

/* ── 총 매수금액 ── */
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 18px;
  border-top: 1px solid #f3f4f6;
}
.total-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #6b7280;
}
.total-value {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

/* ── 피드백 / 버튼 ── */
.success-msg {
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
  margin: 0;
}
.confirm-btn {
  width: 100%;
  height: 54px;
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.confirm-btn:hover:not(:disabled) { opacity: 0.88; }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pos { color: #ef4444; }
.neg { color: #2563eb; }
</style>
