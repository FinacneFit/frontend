<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDepositStore } from '@/stores/depositStore'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  // null = 담기 모드, object = 수정 모드
  editData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const depositStore = useDepositStore()
const isEditMode = computed(() => props.editData !== null)

// 수정 모드일 때 기존 값으로 초기화
const initAmount = props.editData?.amount || 1000000
const initRate   = props.editData?.final_rate ?? Number(props.product.maxRate || props.product.baseRate || 0)
const initMemo   = props.editData?.memo || ''

function fmt(value) {
  return Math.round(Number(value || 0)).toLocaleString('ko-KR')
}

const amount      = ref(initAmount)
const amountStr   = ref(fmt(initAmount))
const rateVal     = ref(initRate)
const memo        = ref(initMemo)
const isSubmitting = ref(false)
const isDeleting   = ref(false)

const TYPE_LABEL = { deposit: '예금', saving: '적금' }

function termToMonths(term) {
  return Number(String(term).replace('개월', '')) || 12
}

function parseMoney(value) {
  return Number(String(value).replace(/[^\d]/g, '')) || 0
}

const maturity = computed(() => {
  const months    = termToMonths(props.product.term)
  const principal = Number(amount.value || 0)
  const rate      = Number(rateVal.value || 0)
  return principal + principal * (rate / 100) * (months / 12)
})

const interest = computed(() => maturity.value - Number(amount.value || 0))

function onAmountInput(event) {
  const value  = parseMoney(event.target.value)
  amount.value = value
  amountStr.value = value ? fmt(value) : ''
}

function onAmountFocus(event) {
  event.target.value = String(amount.value)
}

function onAmountBlur(event) {
  const value  = parseMoney(event.target.value)
  amount.value = value
  amountStr.value = value ? fmt(value) : ''
}

function setAmount(value) {
  amount.value    = value
  amountStr.value = fmt(value)
}

async function submit() {
  if (!amount.value || Number(amount.value) <= 0) return
  isSubmitting.value = true
  try {
    await depositStore.saveProduct(props.product.id, {
      amount:     Number(amount.value),
      final_rate: Number(rateVal.value || 0),
      memo:       memo.value,
    })
    emit('saved', props.product.productName)
    emit('close')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteItem() {
  if (!confirm('포트폴리오에서 삭제할까요?')) return
  isDeleting.value = true
  try {
    await depositStore.deleteSavedProduct(props.product.id)
    emit('deleted', props.product.productName)
    emit('close')
  } finally {
    isDeleting.value = false
  }
}

function onKeyDown(event) {
  if (event.key === 'Escape') emit('close')
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
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">
      <button class="close-btn" type="button" aria-label="닫기" @click="emit('close')">×</button>

      <div class="modal-mode-badge" :class="isEditMode ? 'edit' : 'add'">
        {{ isEditMode ? '수정' : '담기' }}
      </div>

      <h3 class="modal-title">{{ product.productName }}</h3>

      <div class="modal-sub">
        <strong>{{ product.bankName }}</strong>
        <span>·</span>
        <span class="badge" :class="product.productType">{{ TYPE_LABEL[product.productType] }}</span>
        <span>·</span>
        <span>{{ product.term }}</span>
      </div>

      <div class="calc-cards">
        <div class="calc-card">
          <span>예상 만기 금액</span>
          <strong>{{ fmt(maturity) }}원</strong>
          <em>+{{ fmt(interest) }}원</em>
        </div>
        <div class="calc-card">
          <span>적용 금리</span>
          <strong>{{ Number(rateVal || 0).toFixed(2) }}%</strong>
        </div>
        <div class="calc-card">
          <span>가입 기간</span>
          <strong>{{ product.term }}</strong>
        </div>
      </div>

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
          <button
            v-for="quick in [[100, '100만'], [500, '500만'], [1000, '1000만'], [3000, '3000만']]"
            :key="quick[0]"
            type="button"
            @click="setAmount(quick[0] * 10000)"
          >
            {{ quick[1] }}
          </button>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">최종 금리</label>
        <div class="input-with-unit">
          <input v-model="rateVal" type="text" inputmode="decimal" />
          <span>%</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">메모</label>
        <textarea
          v-model="memo"
          class="memo-input"
          rows="3"
          placeholder="선택 사항입니다. 예: 비상금, 단기 목돈, 여행자금 등"
        />
      </div>

      <!-- 버튼 영역 -->
      <div class="action-row" :class="{ 'two-btn': isEditMode }">
        <button
          v-if="isEditMode"
          class="delete-btn"
          type="button"
          :disabled="isDeleting"
          @click="deleteItem"
        >
          {{ isDeleting ? '삭제 중...' : '삭제하기' }}
        </button>

        <button
          class="submit-btn"
          type="button"
          :disabled="isSubmitting || !amount || Number(amount) <= 0"
          @click="submit"
        >
          {{ isSubmitting ? (isEditMode ? '수정 중...' : '추가 중...') : (isEditMode ? '수정하기' : '포트폴리오에 추가하기') }}
        </button>
      </div>
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

.modal-mode-badge {
  display: inline-block;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-mode-badge.add  { background: #dbeafe; color: #1d4ed8; }
.modal-mode-badge.edit { background: #fef3c7; color: #b45309; }

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

.calc-card span   { display: block; font-family: 'Noto Sans KR', sans-serif; color: #9ca3af; font-size: 12px; margin-bottom: 6px; }
.calc-card strong { display: block; font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700; color: #111827; }
.calc-card em     { display: block; margin-top: 4px; font-style: normal; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: #ef4444; }

.form-row { margin-bottom: 18px; }

.form-label {
  display: block;
  margin-bottom: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.input-with-unit {
  display: flex;
  align-items: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 0 14px;
  background: #fff;
}

.input-with-unit input {
  flex: 1;
  border: 0;
  outline: none;
  padding: 13px 0;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.input-with-unit span { margin-left: 8px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #9ca3af; }
.input-with-unit:focus-within { border-color: #1b78fd; }

.quick-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.quick-btns button {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}
.quick-btns button:hover { border-color: #1b78fd; color: #1b78fd; }

.memo-input {
  width: 100%;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  resize: none;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #374151;
  box-sizing: border-box;
}
.memo-input:focus { border-color: #1b78fd; }

.action-row { display: flex; gap: 10px; }
.action-row.two-btn .submit-btn { flex: 1; }

.delete-btn {
  flex-shrink: 0;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 14px 20px;
  background: #fff;
  color: #ef4444;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.delete-btn:hover:not(:disabled)  { background: #ef4444; color: #fff; }
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.submit-btn {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  background: #1b78fd;
  color: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.15s;
}
.submit-btn:hover:not(:disabled) { opacity: 0.9; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 640px) {
  .modal-card { padding: 30px 24px 28px; }
  .calc-cards { grid-template-columns: 1fr; }
  .action-row.two-btn { flex-direction: column; }
}
</style>
