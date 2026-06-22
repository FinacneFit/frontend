<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDepositStore } from '@/stores/depositStore'

const props = defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['close', 'saved'])

const depositStore = useDepositStore()

const amount = ref(1000000)
const amountStr = ref('1,000,000')
const rateVal = ref(props.product.maxRate)

function termToMonths(term) {
  return Number(term.replace('개월', '')) || 12
}

function parseMoney(v) {
  return Number(String(v).replace(/[^\d]/g, '')) || 0
}

function fmt(n) { return Math.round(n).toLocaleString('ko-KR') }

const maturity = computed(() => {
  const months = termToMonths(props.product.term)
  return amount.value + amount.value * (rateVal.value / 100) * (months / 12)
})
const interest = computed(() => maturity.value - amount.value)

function onAmountInput(e) {
  const n = parseMoney(e.target.value)
  amount.value = n
  amountStr.value = n ? fmt(n) : ''
}
function onAmountFocus(e) { e.target.value = String(amount.value) }
function onAmountBlur(e) {
  const n = parseMoney(e.target.value)
  amount.value = n
  amountStr.value = n ? fmt(n) : ''
}
function setAmount(n) {
  amount.value = n
  amountStr.value = fmt(n)
}

async function submit() {
  await depositStore.saveProduct(props.product.id)
  emit('saved', props.product.productName)
  emit('close')
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

const TYPE_LABEL = { deposit: '예금', saving: '적금' }
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">
      <button class="close-btn" @click="$emit('close')" aria-label="닫기">×</button>

      <h3 class="modal-title">{{ product.productName }}</h3>
      <div class="modal-sub">
        <strong>{{ product.bankName }}</strong>
        <span>·</span>
        <span class="badge" :class="product.productType">{{ TYPE_LABEL[product.productType] }}</span>
        <span>·</span>
        <span>{{ product.term }}</span>
      </div>

      <!-- 계산 결과 -->
      <div class="calc-cards">
        <div class="calc-card">
          <span>예상 만기 금액</span>
          <strong>{{ fmt(maturity) }}원</strong>
          <em>+{{ fmt(interest) }}원</em>
        </div>
        <div class="calc-card">
          <span>적용 금리</span>
          <strong>{{ Number(rateVal).toFixed(2) }}%</strong>
        </div>
        <div class="calc-card">
          <span>가입 기간</span>
          <strong>{{ product.term }}</strong>
        </div>
      </div>

      <!-- 납입 금액 -->
      <div class="form-row">
        <label class="form-label">납입 금액</label>
        <div class="input-with-unit">
          <input
            type="text"
            inputmode="numeric"
            :value="amountStr"
            @input="onAmountInput"
            @focus="onAmountFocus"
            @blur="onAmountBlur"
          />
          <span>원</span>
        </div>
        <div class="quick-btns">
          <button v-for="q in [[100,'100만'],[500,'500만'],[1000,'1000만'],[3000,'3000만']]"
            :key="q[0]" type="button" @click="setAmount(q[0] * 10000)">
            {{ q[1] }}
          </button>
        </div>
      </div>

      <!-- 최종 금리 -->
      <div class="form-row">
        <label class="form-label">최종 금리</label>
        <div class="input-with-unit">
          <input
            type="text"
            inputmode="decimal"
            v-model="rateVal"
          />
          <span>%</span>
        </div>
      </div>

      <button class="submit-btn" type="button" @click="submit">
        포트폴리오에 추가하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  width: min(680px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 34px 38px 38px;
  position: relative;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.18);
  animation: pop 0.18s ease;
}
@keyframes pop {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.close-btn {
  position: absolute;
  top: 22px;
  right: 26px;
  border: 0;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: #111827;
  cursor: pointer;
}
.close-btn:hover { color: #6b7280; }

.modal-title {
  margin: 0 0 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.modal-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #9ca3af;
}
.modal-sub strong { color: #374151; font-weight: 700; }
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
}
.badge.deposit { background: #dbeafe; color: #1d4ed8; }
.badge.saving  { background: #dcfce7; color: #166534; }

/* ── 계산 카드 ── */
.calc-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}
.calc-card {
  border: 1px solid #e2e8f0;
  background: #fbfdff;
  border-radius: 12px;
  padding: 16px;
}
.calc-card span {
  display: block;
  font-family: 'Noto Sans KR', sans-serif;
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 6px;
}
.calc-card strong {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.calc-card em {
  display: block;
  margin-top: 3px;
  color: #10b981;
  font-style: normal;
  font-size: 12px;
}

/* ── 폼 ── */
.form-row { margin-bottom: 16px; }
.form-label {
  display: block;
  margin-bottom: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}
.input-with-unit {
  display: flex;
  align-items: center;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.15s;
}
.input-with-unit:focus-within { border-color: #1b78fd; }
.input-with-unit input {
  flex: 1;
  border: 0;
  outline: 0;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.input-with-unit span {
  padding: 0 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #6b7280;
  flex-shrink: 0;
}
.quick-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.quick-btns button {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.quick-btns button:hover { border-color: #1b78fd; color: #1b78fd; }

.submit-btn {
  width: 100%;
  height: 48px;
  margin-top: 10px;
  border: 0;
  border-radius: 12px;
  background: #1b78fd;
  color: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.submit-btn:hover { opacity: 0.88; }
</style>
